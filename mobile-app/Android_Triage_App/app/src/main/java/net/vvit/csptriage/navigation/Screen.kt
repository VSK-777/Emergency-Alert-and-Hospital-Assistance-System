package net.vvit.csptriage.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.MonitorHeart
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Warning
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Dashboard : Screen("dashboard", "Dashboard", Icons.Default.MonitorHeart)
    object Device : Screen("device", "Device", Icons.Default.Bluetooth)
    object Emergency : Screen("emergency", "Emergency", Icons.Default.Warning)
    object History : Screen("history", "History", Icons.Default.History)
    object Contacts : Screen("contacts", "Contacts", Icons.Default.People)
    object Settings : Screen("settings", "Settings", Icons.Default.Settings)

    companion object {
        val bottomNavItems = listOf(
            Dashboard,
            Device,
            Emergency,
            History,
            Settings
        )
    }
}
