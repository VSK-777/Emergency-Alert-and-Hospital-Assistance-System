package net.vvit.csptriage.domain.model

enum class AccidentState(val code: Int, val displayName: String) {
    NORMAL_MONITORING(0, "NORMAL MONITORING"),
    IMPACT_CANDIDATE(1, "IMPACT CANDIDATE"),
    IMMOBILITY_CHECK(2, "IMMOBILITY CHECK"),
    COUNTDOWN(3, "COUNTDOWN"),
    PHYSIOLOGICAL_ASSESSMENT(4, "PHYSIOLOGICAL ASSESSMENT"),
    EMERGENCY_ALERT(5, "EMERGENCY ALERT"),
    CANCELLED(6, "CANCELLED");

    companion object {
        fun fromCode(code: Int): AccidentState {
            return entries.firstOrNull { it.code == code } ?: NORMAL_MONITORING
        }
    }
}
