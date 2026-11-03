package net.vvit.csptriage.domain.model

enum class OperatingMode(val code: Int, val displayName: String) {
    REAL(0, "REAL (HARDWARE)"),
    SIMULATION(1, "SIMULATION (DEMO)");

    companion object {
        fun fromCode(code: Int): OperatingMode {
            return if (code == 1) SIMULATION else REAL
        }
    }
}
