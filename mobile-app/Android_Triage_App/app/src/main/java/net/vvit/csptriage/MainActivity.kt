package net.vvit.csptriage

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import net.vvit.csptriage.navigation.AppNavigation
import net.vvit.csptriage.permissions.PermissionManager
import net.vvit.csptriage.presentation.theme.CSPTriageTheme
import net.vvit.csptriage.presentation.theme.MedicalDarkBackground

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as CSPTriageApplication
        // Start ongoing foreground monitoring service
        app.startMonitoringService()

        setContent {
            CSPTriageTheme(darkTheme = true) {
                // Runtime permissions launcher
                val permissionsLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.RequestMultiplePermissions()
                ) { _ ->
                    // Permissions evaluated
                }

                LaunchedEffect(Unit) {
                    val permissions = PermissionManager.getRequiredPermissions()
                    permissionsLauncher.launch(permissions)
                }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MedicalDarkBackground
                ) {
                    AppNavigation(app = app)
                }
            }
        }
    }
}
