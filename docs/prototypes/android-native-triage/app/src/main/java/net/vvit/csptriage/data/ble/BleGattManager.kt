package net.vvit.csptriage.data.ble

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothProfile
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import net.vvit.csptriage.domain.model.EmergencyEvent
import net.vvit.csptriage.domain.model.TelemetryData
import java.util.ArrayDeque
import java.util.Queue

class BleGattManager(private val context: Context) {

    private var bluetoothGatt: BluetoothGatt? = null
    private val handler = Handler(Looper.getMainLooper())

    private val _connectionState = MutableStateFlow<BleConnectionState>(BleConnectionState.Disconnected)
    val connectionState: StateFlow<BleConnectionState> = _connectionState.asStateFlow()

    private val _latestTelemetry = MutableStateFlow<TelemetryData?>(null)
    val latestTelemetry: StateFlow<TelemetryData?> = _latestTelemetry.asStateFlow()

    private val _emergencyEvents = MutableSharedFlow<EmergencyEvent>(extraBufferCapacity = 64)
    val emergencyEvents: SharedFlow<EmergencyEvent> = _emergencyEvents.asSharedFlow()

    private val telemetryReassembler = BlePacketParser.PacketReassembler()
    private val emergencyReassembler = BlePacketParser.PacketReassembler()

    private var triageService: BluetoothGattService? = null
    private var telemetryChar: BluetoothGattCharacteristic? = null
    private var emergencyChar: BluetoothGattCharacteristic? = null
    private var controlChar: BluetoothGattCharacteristic? = null

    // Queue descriptor writes to avoid GATT collision
    private val descriptorWriteQueue: Queue<BluetoothGattDescriptor> = ArrayDeque()
    private var isWritingDescriptor = false

    // Command write completion callback
    private var pendingCommandCallback: ((Boolean) -> Unit)? = null

    var onDisconnectedUnexpectedly: (() -> Unit)? = null

    private val gattCallback = object : BluetoothGattCallback() {

        @SuppressLint("MissingPermission")
        override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
            val deviceName = gatt.device.name ?: BleConfig.TARGET_DEVICE_NAME
            val deviceAddress = gatt.device.address

            if (status == BluetoothGatt.GATT_SUCCESS && newState == BluetoothProfile.STATE_CONNECTED) {
                _connectionState.value = BleConnectionState.Connected(deviceName, deviceAddress)
                // Request higher MTU for clean binary packets
                handler.post {
                    if (!gatt.requestMtu(BleConfig.DESIRED_MTU)) {
                        // Fallback to service discovery if MTU request fails
                        _connectionState.value = BleConnectionState.DiscoveringServices
                        gatt.discoverServices()
                    }
                }
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED || status != BluetoothGatt.GATT_SUCCESS) {
                val wasReady = _connectionState.value is BleConnectionState.Ready
                teardownGatt()
                _connectionState.value = BleConnectionState.Disconnected
                if (wasReady) {
                    onDisconnectedUnexpectedly?.invoke()
                }
            }
        }

        @SuppressLint("MissingPermission")
        override fun onMtuChanged(gatt: BluetoothGatt, mtu: Int, status: Int) {
            _connectionState.value = BleConnectionState.DiscoveringServices
            handler.post {
                gatt.discoverServices()
            }
        }

        @SuppressLint("MissingPermission")
        override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
            if (status != BluetoothGatt.GATT_SUCCESS) {
                _connectionState.value = BleConnectionState.Error("Failed to discover services (Status: $status)")
                return
            }

            triageService = gatt.getService(BleConfig.TRIAGE_SERVICE_UUID)
            if (triageService == null) {
                // If custom UUID not found, look for matching service or any characteristic
                _connectionState.value = BleConnectionState.Error("Triage GATT Service not found on device")
                return
            }

            telemetryChar = triageService?.getCharacteristic(BleConfig.LIVE_TELEMETRY_CHAR_UUID)
            emergencyChar = triageService?.getCharacteristic(BleConfig.EMERGENCY_EVENT_CHAR_UUID)
            controlChar = triageService?.getCharacteristic(BleConfig.DEVICE_CONTROL_CHAR_UUID)

            _connectionState.value = BleConnectionState.Subscribing

            // Subscribe to Telemetry and Emergency notifications
            handler.post {
                subscribeToCharacteristics(gatt)
            }
        }

        @SuppressLint("MissingPermission")
        override fun onDescriptorWrite(gatt: BluetoothGatt, descriptor: BluetoothGattDescriptor, status: Int) {
            isWritingDescriptor = false
            if (descriptorWriteQueue.isNotEmpty()) {
                val nextDesc = descriptorWriteQueue.poll()
                if (nextDesc != null) {
                    writeNextDescriptor(gatt, nextDesc)
                    return
                }
            }

            // All descriptors written, system is armed and ready
            val deviceName = gatt.device.name ?: BleConfig.TARGET_DEVICE_NAME
            val deviceAddress = gatt.device.address
            _connectionState.value = BleConnectionState.Ready(deviceName, deviceAddress)
        }

        // Android 13+ callback
        override fun onCharacteristicChanged(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            value: ByteArray
        ) {
            processIncomingPacket(characteristic.uuid, value)
        }

        // Deprecated callback for Android 8 - 12
        @Suppress("DEPRECATION")
        override fun onCharacteristicChanged(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic) {
            val value = characteristic.value ?: return
            processIncomingPacket(characteristic.uuid, value)
        }

        override fun onCharacteristicWrite(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            status: Int
        ) {
            val success = (status == BluetoothGatt.GATT_SUCCESS)
            val cb = pendingCommandCallback
            pendingCommandCallback = null
            cb?.invoke(success)
        }
    }

    private fun processIncomingPacket(charUuid: java.util.UUID, bytes: ByteArray) {
        if (charUuid == BleConfig.LIVE_TELEMETRY_CHAR_UUID) {
            val packets = telemetryReassembler.append(bytes)
            for (p in packets) {
                val telemetry = BlePacketParser.parseTelemetry(p)
                if (telemetry != null) {
                    _latestTelemetry.value = telemetry
                }
            }
        } else if (charUuid == BleConfig.EMERGENCY_EVENT_CHAR_UUID) {
            val packets = emergencyReassembler.append(bytes)
            for (p in packets) {
                val event = BlePacketParser.parseEmergencyEvent(p)
                if (event != null) {
                    _emergencyEvents.tryEmit(event)
                }
            }
        }
    }

    @SuppressLint("MissingPermission")
    private fun subscribeToCharacteristics(gatt: BluetoothGatt) {
        descriptorWriteQueue.clear()

        telemetryChar?.let { char ->
            gatt.setCharacteristicNotification(char, true)
            char.getDescriptor(BleConfig.CCCD_DESCRIPTOR_UUID)?.let { desc ->
                desc.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
                descriptorWriteQueue.add(desc)
            }
        }

        emergencyChar?.let { char ->
            gatt.setCharacteristicNotification(char, true)
            char.getDescriptor(BleConfig.CCCD_DESCRIPTOR_UUID)?.let { desc ->
                desc.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
                descriptorWriteQueue.add(desc)
            }
        }

        if (descriptorWriteQueue.isNotEmpty()) {
            val firstDesc = descriptorWriteQueue.poll()
            if (firstDesc != null) {
                writeNextDescriptor(gatt, firstDesc)
            }
        } else {
            val deviceName = gatt.device.name ?: BleConfig.TARGET_DEVICE_NAME
            val deviceAddress = gatt.device.address
            _connectionState.value = BleConnectionState.Ready(deviceName, deviceAddress)
        }
    }

    @SuppressLint("MissingPermission")
    private fun writeNextDescriptor(gatt: BluetoothGatt, descriptor: BluetoothGattDescriptor) {
        isWritingDescriptor = true
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            gatt.writeDescriptor(descriptor, descriptor.value ?: BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE)
        } else {
            @Suppress("DEPRECATION")
            gatt.writeDescriptor(descriptor)
        }
    }

    @SuppressLint("MissingPermission")
    fun connect(device: BluetoothDevice): Boolean {
        teardownGatt()
        val deviceName = device.name ?: BleConfig.TARGET_DEVICE_NAME
        val deviceAddress = device.address
        _connectionState.value = BleConnectionState.Connecting(deviceName, deviceAddress)

        bluetoothGatt = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            device.connectGatt(context, false, gattCallback, BluetoothDevice.TRANSPORT_LE)
        } else {
            device.connectGatt(context, false, gattCallback)
        }
        return bluetoothGatt != null
    }

    @SuppressLint("MissingPermission")
    fun disconnect() {
        bluetoothGatt?.disconnect()
        teardownGatt()
        _connectionState.value = BleConnectionState.Disconnected
    }

    @SuppressLint("MissingPermission")
    private fun teardownGatt() {
        try {
            bluetoothGatt?.close()
        } catch (_: Exception) {}
        bluetoothGatt = null
        triageService = null
        telemetryChar = null
        emergencyChar = null
        controlChar = null
        descriptorWriteQueue.clear()
        isWritingDescriptor = false
    }

    @SuppressLint("MissingPermission")
    fun sendControlCommand(commandBytes: ByteArray, onComplete: ((Boolean) -> Unit)? = null): Boolean {
        val gatt = bluetoothGatt ?: return false
        val char = controlChar ?: return false

        pendingCommandCallback = onComplete

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT
            val res = gatt.writeCharacteristic(char, commandBytes, writeType)
            return res == 0
        } else {
            @Suppress("DEPRECATION")
            char.value = commandBytes
            @Suppress("DEPRECATION")
            char.writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT
            @Suppress("DEPRECATION")
            return gatt.writeCharacteristic(char)
        }
    }
}
