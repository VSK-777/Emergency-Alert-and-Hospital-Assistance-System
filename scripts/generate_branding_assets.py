import os
import sys
import subprocess
import time
from PIL import Image

BASE_DIR = r"C:\Users\Lenovo\Desktop\VSK\B.Tech\CSP\Emergency Alert and Hospital Assistance System"
DOCS_BRANDING = os.path.join(BASE_DIR, "docs", "branding")
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

# ==========================================
# 1. SVG TEMPLATES
# ==========================================

# 1.1 WATCH APP MASTER SVG (512x512)
WATCH_MASTER_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="watchBg" cx="50%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#E53935" />
      <stop offset="45%" stop-color="#B71C1C" />
      <stop offset="85%" stop-color="#3A080C" />
      <stop offset="100%" stop-color="#150204" />
    </radialGradient>
    
    <!-- Metallic Bezel Gradient -->
    <linearGradient id="bezelGrad" x1="20%" y1="10%" x2="80%" y2="90%">
      <stop offset="0%" stop-color="#4A4543" />
      <stop offset="40%" stop-color="#242120" />
      <stop offset="70%" stop-color="#141212" />
      <stop offset="100%" stop-color="#332F2E" />
    </linearGradient>

    <!-- Bezel Highlight Rim -->
    <linearGradient id="bezelRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF8A80" stop-opacity="0.6" />
      <stop offset="50%" stop-color="#B71C1C" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#FF5252" stop-opacity="0.4" />
    </linearGradient>

    <!-- Screen Dark Gradient -->
    <radialGradient id="screenBg" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#180A0D" />
      <stop offset="75%" stop-color="#0D0406" />
      <stop offset="100%" stop-color="#050102" />
    </radialGradient>

    <!-- Glow Filter -->
    <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Base Squircle Background with Drop Shadow -->
  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#watchBg)" filter="url(#softShadow)" />
  
  <!-- Subtle Sensor Radar Rings -->
  <circle cx="256" cy="256" r="210" fill="none" stroke="#FF5252" stroke-opacity="0.12" stroke-width="2" stroke-dasharray="6,8" />
  <circle cx="256" cy="256" r="175" fill="none" stroke="#FF5252" stroke-opacity="0.16" stroke-width="2" />
  <circle cx="256" cy="256" r="140" fill="none" stroke="#FF5252" stroke-opacity="0.10" stroke-width="1.5" stroke-dasharray="4,6" />

  <!-- Watch Strap Hints (Top & Bottom) -->
  <path d="M 200,44 L 312,44 L 302,86 L 210,86 Z" fill="#1C1819" opacity="0.85" />
  <path d="M 210,426 L 302,426 L 312,468 L 200,468 Z" fill="#1C1819" opacity="0.85" />

  <!-- Outer Watch Bezel -->
  <circle cx="256" cy="256" r="150" fill="url(#bezelGrad)" stroke="url(#bezelRim)" stroke-width="3" filter="url(#softShadow)" />

  <!-- Tactical Emergency Crown (Right button) -->
  <path d="M 406,236 C 413,236 418,241 418,247 L 418,265 C 418,271 413,276 406,276 Z" fill="#E53935" stroke="#FFFFFF" stroke-width="1.5" />

  <!-- Watch Glass Display Screen -->
  <circle cx="256" cy="256" r="130" fill="url(#screenBg)" stroke="#FF5252" stroke-opacity="0.3" stroke-width="2" />

  <!-- Sensor Calibration Compass Ticks -->
  <line x1="256" y1="132" x2="256" y2="142" stroke="#EF5350" stroke-width="2.5" stroke-linecap="round" />
  <line x1="256" y1="370" x2="256" y2="380" stroke="#EF5350" stroke-width="2.5" stroke-linecap="round" />
  <line x1="132" y1="256" x2="142" y2="256" stroke="#EF5350" stroke-width="2.5" stroke-linecap="round" />
  <line x1="370" y1="256" x2="380" y2="256" stroke="#EF5350" stroke-width="2.5" stroke-linecap="round" />

  <!-- Subtle Medical Shield Silhouette in Background -->
  <path d="M 256,170 Q 296,170 308,190 Q 308,245 256,290 Q 204,245 204,190 Q 216,170 256,170 Z" 
        fill="#B71C1C" fill-opacity="0.25" stroke="#FF5252" stroke-opacity="0.4" stroke-width="1.5" />

  <!-- Centered Emergency Cross (Soft Glow Backdrop) -->
  <path d="M 244,185 L 268,185 Q 272,185 272,189 L 272,207 L 290,207 Q 294,207 294,211 L 294,235 Q 294,239 290,239 L 272,239 L 272,257 Q 272,261 268,261 L 244,261 Q 240,261 240,257 L 240,239 L 222,239 Q 218,239 218,235 L 218,211 Q 218,207 222,207 L 240,207 L 240,189 Q 240,185 244,185 Z"
        fill="#D32F2F" fill-opacity="0.9" stroke="#FFCDD2" stroke-width="1.5" filter="url(#redGlow)" />

  <!-- Authoritative Heartbeat / ECG Waveform (White & Red Accent) -->
  <path d="M 148,272 L 194,272 L 208,252 L 222,298 L 242,162 L 264,342 L 282,232 L 298,285 L 310,272 L 364,272" 
        fill="none" stroke="#FF1744" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.4" />
  <path d="M 148,272 L 194,272 L 208,252 L 222,298 L 242,162 L 264,342 L 282,232 L 298,285 L 310,272 L 364,272" 
        fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" filter="url(#redGlow)" />

  <!-- High-Precision Peak Pulse Beacon Dot -->
  <circle cx="242" cy="162" r="6" fill="#FFFFFF" stroke="#FF1744" stroke-width="2.5" />
  
  <!-- Subtle SOS Indicator Ring -->
  <circle cx="256" cy="336" r="3" fill="#FF8A80" />
  <circle cx="244" cy="336" r="3" fill="#FF8A80" />
  <circle cx="268" cy="336" r="3" fill="#FF8A80" />
</svg>
"""

# 1.2 WATCH APP ADAPTIVE FOREGROUND (Transparent background, centered inside safe zone)
WATCH_FOREGROUND_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="fgBezel" x1="20%" y1="10%" x2="80%" y2="90%">
      <stop offset="0%" stop-color="#4A4543" />
      <stop offset="40%" stop-color="#242120" />
      <stop offset="70%" stop-color="#141212" />
      <stop offset="100%" stop-color="#332F2E" />
    </linearGradient>
    <radialGradient id="fgScreen" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#1F0D10" />
      <stop offset="75%" stop-color="#0E0406" />
      <stop offset="100%" stop-color="#050102" />
    </radialGradient>
    <filter id="fgGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Watch Strap Hints (Top & Bottom) -->
  <path d="M 216,92 L 296,92 L 288,130 L 224,130 Z" fill="#292524" />
  <path d="M 224,382 L 288,382 L 296,420 L 216,420 Z" fill="#292524" />

  <!-- Watch Bezel Ring (Centered safely at 256, 256, radius 130) -->
  <circle cx="256" cy="256" r="130" fill="url(#fgBezel)" stroke="#FF8A80" stroke-opacity="0.5" stroke-width="2.5" />
  
  <!-- Crown Button -->
  <path d="M 386,240 C 392,240 396,244 396,249 L 396,263 C 396,268 392,272 386,272 Z" fill="#E53935" stroke="#FFFFFF" stroke-width="1.5" />

  <!-- Watch Screen -->
  <circle cx="256" cy="256" r="112" fill="url(#fgScreen)" stroke="#EF5350" stroke-opacity="0.3" stroke-width="1.5" />

  <!-- Ticks -->
  <line x1="256" y1="148" x2="256" y2="156" stroke="#EF5350" stroke-width="2" stroke-linecap="round" />
  <line x1="256" y1="356" x2="256" y2="364" stroke="#EF5350" stroke-width="2" stroke-linecap="round" />
  <line x1="148" y1="256" x2="156" y2="256" stroke="#EF5350" stroke-width="2" stroke-linecap="round" />
  <line x1="356" y1="256" x2="364" y2="256" stroke="#EF5350" stroke-width="2" stroke-linecap="round" />

  <!-- Center Medical Cross Backdrop -->
  <path d="M 245,195 L 267,195 Q 270,195 270,198 L 270,214 L 286,214 Q 289,214 289,217 L 289,239 Q 289,242 286,242 L 270,242 L 270,258 Q 270,261 267,261 L 245,261 Q 242,261 242,258 L 242,242 L 226,242 Q 223,242 223,239 L 223,217 Q 223,214 226,214 L 242,214 L 242,198 Q 242,195 245,195 Z"
        fill="#D32F2F" stroke="#FFCDD2" stroke-width="1.5" filter="url(#fgGlow)" />

  <!-- ECG Line -->
  <path d="M 160,268 L 200,268 L 212,250 L 225,290 L 242,175 L 262,330 L 278,235 L 292,280 L 302,268 L 352,268" 
        fill="none" stroke="#FF1744" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.4" />
  <path d="M 160,268 L 200,268 L 212,250 L 225,290 L 242,175 L 262,330 L 278,235 L 292,280 L 302,268 L 352,268" 
        fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#fgGlow)" />

  <!-- Peak Dot -->
  <circle cx="242" cy="175" r="5" fill="#FFFFFF" stroke="#FF1744" stroke-width="2" />
</svg>
"""

# 1.3 WATCH APP ADAPTIVE BACKGROUND
WATCH_BACKGROUND_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <radialGradient id="watchBgFull" cx="50%" cy="40%" r="75%">
      <stop offset="0%" stop-color="#E53935" />
      <stop offset="45%" stop-color="#B71C1C" />
      <stop offset="85%" stop-color="#3A080C" />
      <stop offset="100%" stop-color="#150204" />
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#watchBgFull)" />
  <circle cx="256" cy="256" r="220" fill="none" stroke="#FF5252" stroke-opacity="0.14" stroke-width="2" stroke-dasharray="6,8" />
  <circle cx="256" cy="256" r="180" fill="none" stroke="#FF5252" stroke-opacity="0.10" stroke-width="2" />
  <circle cx="256" cy="256" r="140" fill="none" stroke="#FF5252" stroke-opacity="0.08" stroke-width="1.5" stroke-dasharray="4,6" />
</svg>
"""

# 1.4 WATCH APP MONOCHROME SVG
WATCH_MONOCHROME_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- Watch Bezel Outline -->
  <circle cx="256" cy="256" r="128" fill="none" stroke="#FFFFFF" stroke-width="12" />
  <path d="M 384,242 C 390,242 394,246 394,251 L 394,261 C 394,266 390,270 384,270 Z" fill="#FFFFFF" />
  <!-- Medical Cross -->
  <path d="M 246,200 L 266,200 L 266,216 L 282,216 L 282,236 L 266,236 L 266,252 L 246,252 L 246,236 L 230,236 L 230,216 L 246,216 Z" fill="#FFFFFF" opacity="0.6" />
  <!-- ECG Line -->
  <path d="M 168,266 L 204,266 L 216,250 L 226,286 L 244,182 L 262,324 L 276,242 L 288,278 L 298,266 L 344,266" 
        fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="244" cy="182" r="5" fill="#FFFFFF" />
</svg>
"""

# ==========================================
# 2. FLUTTER MOBILE APP SVG TEMPLATES
# ==========================================

# 2.1 MOBILE MASTER SVG (512x512)
MOBILE_MASTER_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Background Gradient (Trust Blue to Deep Navy) -->
    <radialGradient id="mobileBg" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#1E88E5" />
      <stop offset="35%" stop-color="#1565C0" />
      <stop offset="75%" stop-color="#0D47A1" />
      <stop offset="100%" stop-color="#061A3A" />
    </radialGradient>

    <!-- Phone Frame Gradient -->
    <linearGradient id="phoneFrame" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155" />
      <stop offset="50%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>

    <!-- Phone Bezel Edge Highlight -->
    <linearGradient id="phoneRim" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#93C5FD" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#3B82F6" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#1D4ED8" stop-opacity="0.6" />
    </linearGradient>

    <!-- Phone Screen Display Gradient -->
    <radialGradient id="phoneScreen" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#0F2448" />
      <stop offset="60%" stop-color="#0A1832" />
      <stop offset="100%" stop-color="#040C1A" />
    </radialGradient>

    <filter id="blueGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="mobileDrop" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#000000" flood-opacity="0.55" />
    </filter>
  </defs>

  <!-- Base Squircle Background -->
  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#mobileBg)" filter="url(#mobileDrop)" />

  <!-- Ambient Radar GPS Coordinates Grid -->
  <circle cx="256" cy="256" r="215" fill="none" stroke="#60A5FA" stroke-opacity="0.12" stroke-width="1.5" stroke-dasharray="6,8" />
  <circle cx="256" cy="256" r="175" fill="none" stroke="#60A5FA" stroke-opacity="0.18" stroke-width="1.5" />
  
  <!-- Modern Smartphone Silhouette (W: 216, H: 350, centered at 256, 256) -->
  <rect x="148" y="81" width="216" height="350" rx="36" fill="url(#phoneFrame)" stroke="url(#phoneRim)" stroke-width="3" filter="url(#mobileDrop)" />

  <!-- Smartphone Inner Display -->
  <rect x="157" y="90" width="198" height="332" rx="28" fill="url(#phoneScreen)" stroke="#3B82F6" stroke-opacity="0.3" stroke-width="1.5" />

  <!-- Dynamic Island / Speaker Pill at Top -->
  <rect x="228" y="99" width="56" height="10" rx="5" fill="#000000" opacity="0.9" />
  <circle cx="274" cy="104" r="2.5" fill="#1E293B" />

  <!-- GPS Beacon Waves (Emanating from Cross) -->
  <circle cx="256" cy="215" r="54" fill="none" stroke="#EF4444" stroke-opacity="0.25" stroke-width="2" stroke-dasharray="4,4" />
  <circle cx="256" cy="215" r="72" fill="none" stroke="#60A5FA" stroke-opacity="0.20" stroke-width="1.5" />

  <!-- Luminous Emergency Healthcare Cross (Vibrant Crimson Red with White Border) -->
  <path d="M 242,175 L 270,175 Q 274,175 274,179 L 274,201 L 296,201 Q 300,201 300,205 L 300,225 Q 300,229 296,229 L 274,229 L 274,251 Q 274,255 270,255 L 242,255 Q 238,255 238,251 L 238,229 L 216,229 Q 212,229 212,225 L 212,205 Q 212,201 216,201 L 238,201 L 238,179 Q 238,175 242,175 Z"
        fill="#D32F2F" stroke="#FFFFFF" stroke-width="2.5" filter="url(#blueGlow)" />

  <!-- Central Location Beacon Pin Header inside Cross -->
  <circle cx="256" cy="215" r="8" fill="#FFFFFF" stroke="#D32F2F" stroke-width="2" />
  <circle cx="256" cy="215" r="3.5" fill="#D32F2F" />

  <!-- Dynamic Heartbeat / ECG Telemetry Waveform -->
  <path d="M 164,286 L 198,286 L 212,264 L 226,315 L 246,155 L 268,360 L 286,245 L 300,300 L 314,286 L 348,286" 
        fill="none" stroke="#EF4444" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.35" />
  <path d="M 164,286 L 198,286 L 212,264 L 226,315 L 246,155 L 268,360 L 286,245 L 300,300 L 314,286 L 348,286" 
        fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" filter="url(#blueGlow)" />

  <!-- Signal Pulse Dot -->
  <circle cx="246" cy="155" r="6" fill="#FFFFFF" stroke="#3B82F6" stroke-width="2" />

  <!-- Home Indicator Bar at Bottom -->
  <rect x="226" y="410" width="60" height="4" rx="2" fill="#94A3B8" opacity="0.7" />
</svg>
"""

# 2.2 MOBILE ADAPTIVE FOREGROUND (Transparent background, centered in safe zone)
MOBILE_FOREGROUND_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="mFgFrame" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155" />
      <stop offset="50%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>
    <radialGradient id="mFgScreen" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#0F2448" />
      <stop offset="60%" stop-color="#0A1832" />
      <stop offset="100%" stop-color="#040C1A" />
    </radialGradient>
    <filter id="mFgGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Smartphone Frame (Scaled safely inside adaptive bounds: W 180, H 290) -->
  <rect x="166" y="111" width="180" height="290" rx="30" fill="url(#mFgFrame)" stroke="#60A5FA" stroke-width="2.5" />
  <rect x="174" y="119" width="164" height="274" rx="22" fill="url(#mFgScreen)" stroke="#3B82F6" stroke-opacity="0.3" stroke-width="1.5" />

  <!-- Dynamic Island -->
  <rect x="232" y="127" width="48" height="8" rx="4" fill="#000000" opacity="0.9" />

  <!-- Emergency Cross -->
  <path d="M 244,185 L 268,185 Q 271,185 271,188 L 271,206 L 289,206 Q 292,206 292,209 L 292,225 Q 292,228 289,228 L 271,228 L 271,246 Q 271,249 268,249 L 244,249 Q 241,249 241,246 L 241,228 L 223,228 Q 220,228 220,225 L 220,209 Q 220,206 223,206 L 241,206 L 241,188 Q 241,185 244,185 Z"
        fill="#D32F2F" stroke="#FFFFFF" stroke-width="2" filter="url(#mFgGlow)" />
  <circle cx="256" cy="217" r="5.5" fill="#FFFFFF" />

  <!-- ECG Line -->
  <path d="M 178,280 L 208,280 L 219,262 L 230,305 L 247,165 L 265,340 L 280,245 L 292,292 L 304,280 L 334,280" 
        fill="none" stroke="#EF4444" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.35" />
  <path d="M 178,280 L 208,280 L 219,262 L 230,305 L 247,165 L 265,340 L 280,245 L 292,292 L 304,280 L 334,280" 
        fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#mFgGlow)" />
  <circle cx="247" cy="165" r="5" fill="#FFFFFF" stroke="#3B82F6" stroke-width="2" />
  <rect x="232" y="381" width="48" height="3" rx="1.5" fill="#94A3B8" opacity="0.6" />
</svg>
"""

# 2.3 MOBILE ADAPTIVE BACKGROUND
MOBILE_BACKGROUND_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <radialGradient id="mBgFull" cx="50%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#1E88E5" />
      <stop offset="35%" stop-color="#1565C0" />
      <stop offset="75%" stop-color="#0D47A1" />
      <stop offset="100%" stop-color="#061A3A" />
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#mBgFull)" />
  <circle cx="256" cy="256" r="225" fill="none" stroke="#60A5FA" stroke-opacity="0.12" stroke-width="2" stroke-dasharray="6,8" />
  <circle cx="256" cy="256" r="180" fill="none" stroke="#60A5FA" stroke-opacity="0.15" stroke-width="1.5" />
</svg>
"""

# 2.4 MOBILE MONOCHROME SVG
MOBILE_MONOCHROME_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect x="166" y="111" width="180" height="290" rx="30" fill="none" stroke="#FFFFFF" stroke-width="12" />
  <path d="M 246,192 L 266,192 L 266,208 L 282,208 L 282,228 L 266,228 L 266,244 L 246,244 L 246,228 L 230,228 L 230,208 L 246,208 Z" fill="#FFFFFF" opacity="0.6" />
  <path d="M 180,280 L 210,280 L 220,264 L 231,304 L 248,172 L 266,336 L 280,246 L 292,290 L 304,280 L 332,280" 
        fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="248" cy="172" r="5" fill="#FFFFFF" />
  <rect x="236" y="126" width="40" height="6" rx="3" fill="#FFFFFF" />
</svg>
"""

# ==========================================
# 3. REACT WEB APP SVG TEMPLATES
# ==========================================

# 3.1 WEB MASTER SVG (512x512)
WEB_MASTER_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Background Gradient (Deep Purple & Midnight Navy) -->
    <radialGradient id="webBg" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#6A1B9A" />
      <stop offset="40%" stop-color="#4527A0" />
      <stop offset="75%" stop-color="#1A0D3F" />
      <stop offset="100%" stop-color="#08031A" />
    </radialGradient>

    <!-- Monitor Frame Gradient -->
    <linearGradient id="monitorFrame" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#312E81" />
      <stop offset="50%" stop-color="#1E1B4B" />
      <stop offset="100%" stop-color="#0F0C2E" />
    </linearGradient>

    <!-- Screen Bezel Trim -->
    <linearGradient id="monitorRim" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#A78BFA" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#7C3AED" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#4C1D95" stop-opacity="0.6" />
    </linearGradient>

    <!-- Operations Screen Interior -->
    <radialGradient id="screenDisplay" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#1E1242" />
      <stop offset="70%" stop-color="#0D0722" />
      <stop offset="100%" stop-color="#050212" />
    </radialGradient>

    <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="webDrop" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Base Squircle Background -->
  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#webBg)" filter="url(#webDrop)" />

  <!-- Multi-Role Coordination Nexus Radar Arcs -->
  <circle cx="256" cy="235" r="195" fill="none" stroke="#C084FC" stroke-opacity="0.12" stroke-width="1.5" stroke-dasharray="6,8" />
  <circle cx="256" cy="235" r="155" fill="none" stroke="#818CF8" stroke-opacity="0.16" stroke-width="1.5" />

  <!-- Command Center Monitor Stand & Base -->
  <path d="M 238,365 L 274,365 L 284,405 L 228,405 Z" fill="#1E1B4B" stroke="#4C1D95" stroke-width="2" />
  <rect x="196" y="405" width="120" height="14" rx="7" fill="#312E81" stroke="#A78BFA" stroke-width="1.5" filter="url(#webDrop)" />

  <!-- Widescreen Monitor Frame (W: 340, H: 240, centered at 256, 235) -->
  <rect x="86" y="115" width="340" height="240" rx="28" fill="url(#monitorFrame)" stroke="url(#monitorRim)" stroke-width="3" filter="url(#webDrop)" />

  <!-- Operations Screen Interior -->
  <rect x="98" y="127" width="316" height="216" rx="20" fill="url(#screenDisplay)" stroke="#6366F1" stroke-opacity="0.3" stroke-width="1.5" />

  <!-- Grid lines representing centralized dispatch -->
  <line x1="102" y1="235" x2="410" y2="235" stroke="#4F46E5" stroke-opacity="0.15" stroke-width="1" />
  <line x1="256" y1="130" x2="256" y2="340" stroke="#4F46E5" stroke-opacity="0.15" stroke-width="1" />

  <!-- 4 Role Quadrant Nodes (Admin, Hospital, Responder, Citizen) -->
  <!-- Top-Left: Admin Node -->
  <circle cx="160" cy="180" r="10" fill="#4F46E5" stroke="#A78BFA" stroke-width="2" />
  <circle cx="160" cy="180" r="4" fill="#FFFFFF" />
  <!-- Top-Right: Hospital Staff Node -->
  <circle cx="352" cy="180" r="10" fill="#DC2626" stroke="#FCA5A5" stroke-width="2" />
  <circle cx="352" cy="180" r="4" fill="#FFFFFF" />
  <!-- Bottom-Left: First Responder Node -->
  <circle cx="160" cy="290" r="10" fill="#2563EB" stroke="#93C5FD" stroke-width="2" />
  <circle cx="160" cy="290" r="4" fill="#FFFFFF" />
  <!-- Bottom-Right: Citizen/Patient Node -->
  <circle cx="352" cy="290" r="10" fill="#059669" stroke="#6EE7B7" stroke-width="2" />
  <circle cx="352" cy="290" r="4" fill="#FFFFFF" />

  <!-- Connecting Telemetry Arcs to Center -->
  <line x1="168" y1="187" x2="236" y2="225" stroke="#818CF8" stroke-opacity="0.4" stroke-width="1.5" stroke-dasharray="3,3" />
  <line x1="344" y1="187" x2="276" y2="225" stroke="#F87171" stroke-opacity="0.4" stroke-width="1.5" stroke-dasharray="3,3" />
  <line x1="168" y1="283" x2="236" y2="245" stroke="#60A5FA" stroke-opacity="0.4" stroke-width="1.5" stroke-dasharray="3,3" />
  <line x1="344" y1="283" x2="276" y2="245" stroke="#34D399" stroke-opacity="0.4" stroke-width="1.5" stroke-dasharray="3,3" />

  <!-- Central Emergency Nexus Cross -->
  <path d="M 244,195 L 268,195 Q 271,195 271,198 L 271,216 L 289,216 Q 292,216 292,219 L 292,239 Q 292,242 289,242 L 271,242 L 271,260 Q 271,263 268,263 L 244,263 Q 241,263 241,260 L 241,242 L 223,242 Q 220,242 220,239 L 220,219 Q 220,216 223,216 L 241,216 L 241,198 Q 241,195 244,195 Z"
        fill="#EF4444" stroke="#FFFFFF" stroke-width="2.5" filter="url(#purpleGlow)" />

  <!-- Real-Time Dynamic ECG Pulse traversing across screen -->
  <path d="M 104,235 L 175,235 L 188,218 L 202,256 L 224,152 L 244,305 L 262,205 L 274,248 L 286,235 L 410,235" 
        fill="none" stroke="#C084FC" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.35" />
  <path d="M 104,235 L 175,235 L 188,218 L 202,256 L 224,152 L 244,305 L 262,205 L 274,248 L 286,235 L 410,235" 
        fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#purpleGlow)" />

  <!-- Beacon Apex Indicator -->
  <circle cx="224" cy="152" r="5" fill="#FFFFFF" stroke="#A78BFA" stroke-width="2" />
</svg>
"""

# 3.2 WEB APP FAVICON SVG (Optimized specifically for 16x16 - 48x48 high contrast)
WEB_FAVICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
  <defs>
    <linearGradient id="favBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6A1B9A" />
      <stop offset="100%" stop-color="#1A0D3F" />
    </linearGradient>
  </defs>
  <!-- Rounded Squircle -->
  <rect x="4" y="4" width="120" height="120" rx="30" fill="url(#favBg)" />
  <!-- High Contrast Emergency Cross -->
  <path d="M 52,24 L 76,24 Q 78,24 78,26 L 78,48 L 100,48 Q 102,48 102,50 L 102,74 Q 102,76 100,76 L 78,76 L 78,98 Q 78,100 76,100 L 52,100 Q 50,100 50,98 L 50,76 L 28,76 Q 26,76 26,74 L 26,50 Q 26,48 28,48 L 50,48 L 50,26 Q 50,24 52,24 Z"
        fill="#EF4444" stroke="#FFFFFF" stroke-width="4" />
  <!-- Prominent ECG Line in Center -->
  <path d="M 12,62 L 36,62 L 44,50 L 54,78 L 64,32 L 74,90 L 84,54 L 92,62 L 116,62" 
        fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
</svg>
"""

def write_files():
    print(">>> 1. Writing SVG source files...")
    svg_map = {
        # Watch App
        os.path.join(DOCS_BRANDING, "watch-app", "svg", "watch_icon_master.svg"): WATCH_MASTER_SVG,
        os.path.join(DOCS_BRANDING, "watch-app", "svg", "watch_icon_foreground.svg"): WATCH_FOREGROUND_SVG,
        os.path.join(DOCS_BRANDING, "watch-app", "svg", "watch_icon_background.svg"): WATCH_BACKGROUND_SVG,
        os.path.join(DOCS_BRANDING, "watch-app", "svg", "watch_icon_monochrome.svg"): WATCH_MONOCHROME_SVG,
        # Mobile App
        os.path.join(DOCS_BRANDING, "mobile-app", "svg", "mobile_icon_master.svg"): MOBILE_MASTER_SVG,
        os.path.join(DOCS_BRANDING, "mobile-app", "svg", "mobile_icon_foreground.svg"): MOBILE_FOREGROUND_SVG,
        os.path.join(DOCS_BRANDING, "mobile-app", "svg", "mobile_icon_background.svg"): MOBILE_BACKGROUND_SVG,
        os.path.join(DOCS_BRANDING, "mobile-app", "svg", "mobile_icon_monochrome.svg"): MOBILE_MONOCHROME_SVG,
        # Web App
        os.path.join(DOCS_BRANDING, "web-app", "svg", "web_icon_master.svg"): WEB_MASTER_SVG,
        os.path.join(DOCS_BRANDING, "web-app", "svg", "web_icon_favicon.svg"): WEB_FAVICON_SVG,
    }
    for path, content in svg_map.items():
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content.strip())
        print(f"  Wrote: {os.path.relpath(path, BASE_DIR)}")

def render_svg_to_png(svg_path, output_png_path, size=1024):
    """Renders an SVG file to PNG using Headless Google Chrome."""
    abs_svg = os.path.abspath(svg_path)
    abs_png = os.path.abspath(output_png_path)
    os.makedirs(os.path.dirname(abs_png), exist_ok=True)
    svg_url = abs_svg.replace("\\", "/")

    # HTML wrapper for exact viewport sizing and zero margins
    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body {{
    margin: 0;
    padding: 0;
    width: {size}px;
    height: {size}px;
    background: transparent;
    overflow: hidden;
  }}
  img {{
    width: {size}px;
    height: {size}px;
    display: block;
  }}
</style>
</head>
<body>
  <img src="file:///{svg_url}" />
</body>
</html>"""
    temp_html = os.path.join(os.path.dirname(abs_png), f"_temp_{size}.html")
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_content)

    temp_user_data = os.path.join(os.environ.get("TEMP", "C:\\temp"), f"chrome_render_{int(time.time()*1000)}")
    temp_html_url = os.path.abspath(temp_html).replace("\\", "/")

    cmd = [
        CHROME_PATH,
        "--headless",
        "--disable-gpu",
        f"--user-data-dir={temp_user_data}",
        f"--window-size={size},{size}",
        "--default-background-color=00000000",
        f"--screenshot={abs_png}",
        f"file:///{temp_html_url}"
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(temp_html):
        try: os.remove(temp_html)
        except: pass

    if os.path.exists(abs_png):
        print(f"  Rendered ({size}x{size}): {os.path.relpath(abs_png, BASE_DIR)}")
        return True
    else:
        print(f"  [ERROR] Failed to render {output_png_path}. Stderr: {result.stderr}")
        return False

def generate_rasters():
    print("\n>>> 2. Rendering Master High-Resolution PNGs via Chrome...")
    
    # 2.1 Watch App Masters
    render_svg_to_png(
        os.path.join(DOCS_BRANDING, "watch-app", "svg", "watch_icon_master.svg"),
        os.path.join(DOCS_BRANDING, "watch-app", "master", "watch_icon_1024.png"),
        size=1024
    )
    render_svg_to_png(
        os.path.join(DOCS_BRANDING, "watch-app", "svg", "watch_icon_foreground.svg"),
        os.path.join(DOCS_BRANDING, "watch-app", "adaptive", "watch_foreground_1024.png"),
        size=1024
    )
    render_svg_to_png(
        os.path.join(DOCS_BRANDING, "watch-app", "svg", "watch_icon_background.svg"),
        os.path.join(DOCS_BRANDING, "watch-app", "adaptive", "watch_background_1024.png"),
        size=1024
    )
    render_svg_to_png(
        os.path.join(DOCS_BRANDING, "watch-app", "svg", "watch_icon_monochrome.svg"),
        os.path.join(DOCS_BRANDING, "watch-app", "monochrome", "watch_monochrome_1024.png"),
        size=1024
    )

    # 2.2 Mobile App Masters
    render_svg_to_png(
        os.path.join(DOCS_BRANDING, "mobile-app", "svg", "mobile_icon_master.svg"),
        os.path.join(DOCS_BRANDING, "mobile-app", "master", "mobile_icon_1024.png"),
        size=1024
    )
    render_svg_to_png(
        os.path.join(DOCS_BRANDING, "mobile-app", "svg", "mobile_icon_foreground.svg"),
        os.path.join(DOCS_BRANDING, "mobile-app", "android", "mobile_foreground_1024.png"),
        size=1024
    )
    render_svg_to_png(
        os.path.join(DOCS_BRANDING, "mobile-app", "svg", "mobile_icon_background.svg"),
        os.path.join(DOCS_BRANDING, "mobile-app", "android", "mobile_background_1024.png"),
        size=1024
    )
    render_svg_to_png(
        os.path.join(DOCS_BRANDING, "mobile-app", "svg", "mobile_icon_monochrome.svg"),
        os.path.join(DOCS_BRANDING, "mobile-app", "android", "mobile_monochrome_1024.png"),
        size=1024
    )

    # 2.3 Web App Masters
    render_svg_to_png(
        os.path.join(DOCS_BRANDING, "web-app", "svg", "web_icon_master.svg"),
        os.path.join(DOCS_BRANDING, "web-app", "master", "web_icon_1024.png"),
        size=1024
    )
    render_svg_to_png(
        os.path.join(DOCS_BRANDING, "web-app", "svg", "web_icon_favicon.svg"),
        os.path.join(DOCS_BRANDING, "web-app", "favicon", "favicon_master_512.png"),
        size=512
    )

def create_density_derivatives():
    print("\n>>> 3. Generating Multi-Density Variants with Pillow (Lanczos)...")

    # 3.1 Watch App Variants
    master_watch = Image.open(os.path.join(DOCS_BRANDING, "watch-app", "master", "watch_icon_1024.png"))
    watch_sizes = [512, 192, 144, 96, 72, 48, 36]
    for s in watch_sizes:
        resized = master_watch.resize((s, s), Image.Resampling.LANCZOS)
        resized.save(os.path.join(DOCS_BRANDING, "watch-app", "png", f"watch_icon_{s}.png"))
        print(f"  Watch App PNG: {s}x{s}")

    # 3.2 Mobile App Variants
    master_mobile = Image.open(os.path.join(DOCS_BRANDING, "mobile-app", "master", "mobile_icon_1024.png"))
    mobile_sizes = [512, 192, 144, 96, 72, 48]
    for s in mobile_sizes:
        resized = master_mobile.resize((s, s), Image.Resampling.LANCZOS)
        resized.save(os.path.join(DOCS_BRANDING, "mobile-app", "png", f"mobile_icon_{s}.png"))
        print(f"  Mobile App PNG: {s}x{s}")

    # iOS AppIcon Sizes (standard Apple specifications)
    ios_sizes = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024]
    for s in ios_sizes:
        resized = master_mobile.resize((s, s), Image.Resampling.LANCZOS)
        resized.save(os.path.join(DOCS_BRANDING, "mobile-app", "ios", f"Icon-App-{s}x{s}.png"))
    print(f"  Generated {len(ios_sizes)} iOS AppIcon variants.")

    # 3.3 Web App Variants & Favicons
    master_web = Image.open(os.path.join(DOCS_BRANDING, "web-app", "master", "web_icon_1024.png"))
    fav_master = Image.open(os.path.join(DOCS_BRANDING, "web-app", "favicon", "favicon_master_512.png"))

    web_png_sizes = [512, 192, 180, 128, 64, 48, 32, 16]
    for s in web_png_sizes:
        # Use high contrast favicon master for 16, 32, 48
        source = fav_master if s <= 48 else master_web
        resized = source.resize((s, s), Image.Resampling.LANCZOS)
        resized.save(os.path.join(DOCS_BRANDING, "web-app", "png", f"web_icon_{s}.png"))
        if s in [16, 32, 48, 64, 128]:
            resized.save(os.path.join(DOCS_BRANDING, "web-app", "favicon", f"favicon-{s}x{s}.png"))
        if s == 180:
            resized.save(os.path.join(DOCS_BRANDING, "web-app", "favicon", "apple-touch-icon.png"))
        if s == 192:
            resized.save(os.path.join(DOCS_BRANDING, "web-app", "favicon", "pwa-192x192.png"))
        if s == 512:
            resized.save(os.path.join(DOCS_BRANDING, "web-app", "favicon", "pwa-512x512.png"))
        print(f"  Web App PNG: {s}x{s}")

    # Generate multi-size favicon.ico (16, 32, 48)
    fav_images = [
        fav_master.resize((16, 16), Image.Resampling.LANCZOS),
        fav_master.resize((32, 32), Image.Resampling.LANCZOS),
        fav_master.resize((48, 48), Image.Resampling.LANCZOS)
    ]
    fav_images[0].save(
        os.path.join(DOCS_BRANDING, "web-app", "favicon", "favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=fav_images[1:]
    )
    print("  Generated multi-resolution favicon.ico")

if __name__ == "__main__":
    write_files()
    generate_rasters()
    create_density_derivatives()
    print("\n>>> All branding assets successfully generated!")
