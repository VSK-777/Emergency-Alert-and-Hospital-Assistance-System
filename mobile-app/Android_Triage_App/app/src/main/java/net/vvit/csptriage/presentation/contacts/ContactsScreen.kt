package net.vvit.csptriage.presentation.contacts

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarBorder
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import net.vvit.csptriage.domain.model.EmergencyContact
import net.vvit.csptriage.presentation.components.StatusPill
import net.vvit.csptriage.presentation.components.StatusPillType
import net.vvit.csptriage.presentation.theme.MedicalAccentBlue
import net.vvit.csptriage.presentation.theme.MedicalCardBorder
import net.vvit.csptriage.presentation.theme.MedicalDarkBackground
import net.vvit.csptriage.presentation.theme.MedicalDarkCard
import net.vvit.csptriage.presentation.theme.MedicalDarkSurface
import net.vvit.csptriage.presentation.theme.MedicalEmergencyRed
import net.vvit.csptriage.presentation.theme.MedicalVitalGreen
import net.vvit.csptriage.presentation.theme.TextMutedDark
import net.vvit.csptriage.presentation.theme.TextPrimaryDark
import net.vvit.csptriage.presentation.theme.TextSecondaryDark

@Composable
fun ContactsScreen(
    viewModel: ContactsViewModel,
    modifier: Modifier = Modifier
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(state.feedbackMessage) {
        state.feedbackMessage?.let { msg ->
            snackbarHostState.showSnackbar(msg)
            viewModel.clearFeedback()
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MedicalDarkBackground)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Emergency Contacts",
                        color = TextPrimaryDark,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Guardians & trauma room coordinators",
                        color = TextSecondaryDark,
                        fontSize = 13.sp
                    )
                }

                Button(
                    onClick = { viewModel.openAddDialog() },
                    colors = ButtonDefaults.buttonColors(containerColor = MedicalAccentBlue),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.padding(horizontal = 2.dp))
                    Text("Add", fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (state.contacts.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "No Contacts Saved",
                            color = TextPrimaryDark,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Add guardians or nearby trauma centers to receive emergency alerts.",
                            color = TextMutedDark,
                            fontSize = 12.sp
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(state.contacts) { contact ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = MedicalDarkCard),
                            border = BorderStroke(1.dp, if (contact.isPrimary) MedicalAccentBlue else MedicalCardBorder)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = contact.name,
                                            color = TextPrimaryDark,
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        if (contact.isPrimary) {
                                            Spacer(modifier = Modifier.padding(horizontal = 6.dp))
                                            StatusPill("Primary Contact", StatusPillType.INFO)
                                        }
                                    }

                                    Row {
                                        IconButton(onClick = { viewModel.openEditDialog(contact) }) {
                                            Icon(Icons.Default.Edit, contentDescription = "Edit", tint = TextSecondaryDark, modifier = Modifier.size(20.dp))
                                        }
                                        IconButton(onClick = { viewModel.deleteContact(contact.id) }) {
                                            Icon(Icons.Default.Delete, contentDescription = "Delete", tint = MedicalEmergencyRed, modifier = Modifier.size(20.dp))
                                        }
                                    }
                                }

                                Text(
                                    text = "${contact.relationship} • ${contact.phoneNumber}",
                                    color = TextSecondaryDark,
                                    fontSize = 13.sp
                                )

                                Spacer(modifier = Modifier.height(10.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    if (!contact.isPrimary) {
                                        Button(
                                            onClick = { viewModel.setPrimaryContact(contact.id) },
                                            colors = ButtonDefaults.buttonColors(containerColor = MedicalDarkSurface),
                                            shape = RoundedCornerShape(8.dp),
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Icon(Icons.Default.StarBorder, contentDescription = null, modifier = Modifier.size(16.dp))
                                            Spacer(modifier = Modifier.padding(horizontal = 2.dp))
                                            Text("Set Primary", fontSize = 11.sp)
                                        }
                                    }

                                    Button(
                                        onClick = {
                                            val testMsg = "TEST ALERT: CSP Triage notification check for ${contact.name}. Hardware link armed."
                                            val intent = Intent(Intent.ACTION_SENDTO).apply {
                                                data = Uri.parse("smsto:${contact.phoneNumber}")
                                                putExtra("sms_body", testMsg)
                                            }
                                            context.startActivity(intent)
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = MedicalAccentBlue.copy(alpha = 0.2f), contentColor = MedicalAccentBlue),
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text("Test Dispatch", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }

                    item {
                        Spacer(modifier = Modifier.height(80.dp))
                    }
                }
            }
        }

        // Add/Edit Dialog
        if (state.isAddDialogOpen) {
            ContactDialog(
                initial = state.editingContact,
                onDismiss = { viewModel.closeDialog() },
                onSave = { name, phone, rel, isPrimary ->
                    viewModel.saveContact(name, phone, rel, isPrimary)
                }
            )
        }

        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 70.dp)
        )
    }
}

@Composable
private fun ContactDialog(
    initial: EmergencyContact?,
    onDismiss: () -> Unit,
    onSave: (String, String, String, Boolean) -> Unit
) {
    var name by remember { mutableStateOf(initial?.name ?: "") }
    var phone by remember { mutableStateOf(initial?.phoneNumber ?: "") }
    var relationship by remember { mutableStateOf(initial?.relationship ?: "") }
    var isPrimary by remember { mutableStateOf(initial?.isPrimary ?: false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = if (initial == null) "Add Emergency Contact" else "Edit Contact",
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Full Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Phone Number (+91...)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = relationship,
                    onValueChange = { relationship = it },
                    label = { Text("Relationship (e.g. Guardian, Spouse, Hospital)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = isPrimary,
                        onCheckedChange = { isPrimary = it }
                    )
                    Text(text = "Designate as Primary Contact", fontSize = 13.sp)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onSave(name, phone, relationship, isPrimary) },
                colors = ButtonDefaults.buttonColors(containerColor = MedicalAccentBlue)
            ) {
                Text("Save Contact", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
