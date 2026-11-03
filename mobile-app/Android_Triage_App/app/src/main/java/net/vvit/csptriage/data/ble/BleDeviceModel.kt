package net.vvit.csptriage.data.ble

import android.bluetooth.BluetoothDevice

data class BleDeviceModel(
    val device: BluetoothDevice,
    val name: String,
    val address: String,
    val rssi: Int,
    val isTargetDevice: Boolean,
    val lastSeenTimestamp: Long = System.currentTimeMillis()
)
