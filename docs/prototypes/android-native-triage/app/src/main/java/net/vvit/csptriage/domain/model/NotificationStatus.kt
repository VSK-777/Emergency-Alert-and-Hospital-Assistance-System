package net.vvit.csptriage.domain.model

enum class NotificationStatus(val displayName: String) {
    PENDING("Pending"),
    INITIATED("Initiated (Intent Dispatched)"),
    SENT("Sent via Carrier"),
    DELIVERED("Delivered with Confirmation"),
    FAILED("Delivery Failed"),
    UNCONFIRMED("Awaiting Verification")
}
