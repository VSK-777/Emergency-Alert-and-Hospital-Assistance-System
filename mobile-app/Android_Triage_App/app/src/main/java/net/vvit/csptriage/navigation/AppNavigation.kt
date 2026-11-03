package net.vvit.csptriage.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import net.vvit.csptriage.CSPTriageApplication
import net.vvit.csptriage.presentation.contacts.ContactsScreen
import net.vvit.csptriage.presentation.contacts.ContactsViewModel
import net.vvit.csptriage.presentation.dashboard.DashboardScreen
import net.vvit.csptriage.presentation.dashboard.DashboardViewModel
import net.vvit.csptriage.presentation.device.DeviceScreen
import net.vvit.csptriage.presentation.device.DeviceViewModel
import net.vvit.csptriage.presentation.emergency.EmergencyScreen
import net.vvit.csptriage.presentation.emergency.EmergencyViewModel
import net.vvit.csptriage.presentation.history.HistoryScreen
import net.vvit.csptriage.presentation.history.HistoryViewModel
import net.vvit.csptriage.presentation.settings.SettingsScreen
import net.vvit.csptriage.presentation.settings.SettingsViewModel
import net.vvit.csptriage.presentation.theme.MedicalAccentBlue
import net.vvit.csptriage.presentation.theme.MedicalDarkBackground
import net.vvit.csptriage.presentation.theme.MedicalDarkSurface
import net.vvit.csptriage.presentation.theme.TextMutedDark

@Composable
fun AppNavigation(app: CSPTriageApplication) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = MedicalDarkSurface,
                contentColor = Color.White
            ) {
                Screen.bottomNavItems.forEach { screen ->
                    val isSelected = currentRoute == screen.route
                    NavigationBarItem(
                        icon = { Icon(screen.icon, contentDescription = screen.title) },
                        label = { Text(screen.title, fontSize = 11.sp) },
                        selected = isSelected,
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MedicalAccentBlue,
                            selectedTextColor = MedicalAccentBlue,
                            unselectedIconColor = TextMutedDark,
                            unselectedTextColor = TextMutedDark,
                            indicatorColor = MedicalDarkBackground
                        ),
                        onClick = {
                            if (currentRoute != screen.route) {
                                navController.navigate(screen.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Dashboard.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Dashboard.route) {
                val vm: DashboardViewModel = viewModel(
                    factory = DashboardViewModel.Factory(
                        app.triageRepository,
                        app.getLiveTelemetryUseCase,
                        app.cancelEmergencyCountdownUseCase
                    )
                )
                DashboardScreen(viewModel = vm)
            }

            composable(Screen.Device.route) {
                val vm: DeviceViewModel = viewModel(
                    factory = DeviceViewModel.Factory(app.triageRepository)
                )
                DeviceScreen(viewModel = vm)
            }

            composable(Screen.Emergency.route) {
                val vm: EmergencyViewModel = viewModel(
                    factory = EmergencyViewModel.Factory(
                        app.triageRepository,
                        app.contactRepository,
                        app.dispatchEmergencyAlertUseCase,
                        app.cancelEmergencyCountdownUseCase
                    )
                )
                EmergencyScreen(viewModel = vm)
            }

            composable(Screen.History.route) {
                val vm: HistoryViewModel = viewModel(
                    factory = HistoryViewModel.Factory(app.triageRepository)
                )
                HistoryScreen(viewModel = vm)
            }

            composable(Screen.Contacts.route) {
                val vm: ContactsViewModel = viewModel(
                    factory = ContactsViewModel.Factory(app.contactRepository)
                )
                ContactsScreen(viewModel = vm)
            }

            composable(Screen.Settings.route) {
                val vm: SettingsViewModel = viewModel(
                    factory = SettingsViewModel.Factory(
                        app.triageRepository,
                        app.sendSimulationCommandUseCase
                    )
                )
                SettingsScreen(
                    viewModel = vm,
                    onNavigateToContacts = {
                        navController.navigate(Screen.Contacts.route)
                    }
                )
            }
        }
    }
}
