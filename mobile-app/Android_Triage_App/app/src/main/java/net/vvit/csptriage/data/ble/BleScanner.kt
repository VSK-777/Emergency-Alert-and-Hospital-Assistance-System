package net.vvit.csptriage.data.ble

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.os.Handler
import android.os.Looper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class BleScanner(private val context: Context) {

    private val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()
    private var scanner: BluetoothLeScanner? = null
    private val handler = Handler(Looper.getMainLooper())

    private val _scannedDevices = MutableStateFlow<Map<String, BleDeviceModel>>(emptyMap())
    val scannedDevices: StateFlow<Map<String, BleDeviceModel>> = _scannedDevices.asStateFlow()

    private val _isScanning = MutableStateFlow(false)
    val isScanning: StateFlow<Boolean> = _isScanning.asStateFlow()

    private val scanCallback = object : ScanCallback() {
        @SuppressLint("MissingPermission")
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            val device: BluetoothDevice = result.device
            val name = result.scanRecord?.deviceName ?: device.name ?: "Unknown Device"
            val address = device.address ?: return
            val isTarget = name.equals(BleConfig.TARGET_DEVICE_NAME, ignoreCase = true)

            val model = BleDeviceModel(
                device = device,
                name = name,
                address = address,
                rssi = result.rssi,
                isTargetDevice = isTarget,
                lastSeenTimestamp = System.currentTimeMillis()
            )

            val currentMap = _scannedDevices.value.toMutableMap()
            currentMap[address] = model
            _scannedDevices.value = currentMap
        }

        override fun onBatchScanResults(results: MutableList<ScanResult>) {
            results.forEach { onScanResult(ScanSettings.CALLBACK_TYPE_ALL_MATCHES, it) }
        }

        override fun onScanFailed(errorCode: Int) {
            _isScanning.value = false
        }
    }

    val isBluetoothEnabled: Boolean
        get() = bluetoothAdapter?.isEnabled == true

    @SuppressLint("MissingPermission")
    fun startScan(timeoutMs: Long = BleConfig.SCAN_TIMEOUT_MS, filterTargetOnly: Boolean = false): Boolean {
        if (!isBluetoothEnabled) return false
        if (_isScanning.value) return true

        scanner = bluetoothAdapter?.bluetoothLeScanner
        if (scanner == null) return false

        _scannedDevices.value = emptyMap()

        val filters = mutableListOf<ScanFilter>()
        if (filterTargetOnly) {
            filters.add(ScanFilter.Builder().setDeviceName(BleConfig.TARGET_DEVICE_NAME).build())
        }

        val settings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .setReportDelay(0)
            .build()

        try {
            scanner?.startScan(filters, settings, scanCallback)
            _isScanning.value = true

            // Stop automatically after timeout
            handler.postDelayed({
                stopScan()
            }, timeoutMs)
            return true
        } catch (e: Exception) {
            _isScanning.value = false
            return false
        }
    }

    @SuppressLint("MissingPermission")
    fun stopScan() {
        if (!_isScanning.value) return
        try {
            scanner?.stopScan(scanCallback)
        } catch (_: Exception) {}
        _isScanning.value = false
    }

    fun clearDevices() {
        _scannedDevices.value = emptyMap()
    }
}
