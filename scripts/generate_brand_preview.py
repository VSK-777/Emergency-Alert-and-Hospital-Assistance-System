import os
import subprocess
import time

BASE_DIR = r"C:\Users\Lenovo\Desktop\VSK\B.Tech\CSP\Emergency Alert and Hospital Assistance System"
DOCS_BRANDING = os.path.join(BASE_DIR, "docs", "branding")
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PREVIEW_HTML = os.path.join(DOCS_BRANDING, "brand_preview.html")
PREVIEW_PNG = os.path.join(DOCS_BRANDING, "brand_preview.png")

watch_png = os.path.join(DOCS_BRANDING, "watch-app", "master", "watch_icon_1024.png").replace("\\", "/")
mobile_png = os.path.join(DOCS_BRANDING, "mobile-app", "master", "mobile_icon_1024.png").replace("\\", "/")
web_png = os.path.join(DOCS_BRANDING, "web-app", "master", "web_icon_1024.png").replace("\\", "/")

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Emergency Alert and Hospital Assistance System - Brand Identity</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: #090D16;
      color: #F1F5F9;
      font-family: 'Plus Jakarta Sans', sans-serif;
      padding: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }}
    .header {{
      text-align: center;
      margin-bottom: 40px;
    }}
    .badge {{
      display: inline-block;
      padding: 6px 14px;
      background: rgba(220, 38, 38, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.35);
      border-radius: 9999px;
      color: #F87171;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }}
    h1 {{
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #FFFFFF 30%, #94A3B8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }}
    .subtitle {{
      color: #64748B;
      font-size: 16px;
      font-weight: 500;
    }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 32px;
      max-width: 1100px;
      width: 100%;
    }}
    .card {{
      background: #0F172A;
      border: 1px solid #1E293B;
      border-radius: 24px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }}
    .icon-wrapper {{
      width: 200px;
      height: 200px;
      border-radius: 44px;
      overflow: hidden;
      margin-bottom: 24px;
      box-shadow: 0 16px 32px rgba(0,0,0,0.6);
      border: 1px solid rgba(255,255,255,0.1);
    }}
    .icon-wrapper img {{
      width: 100%;
      height: 100%;
      display: block;
    }}
    .app-title {{
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 6px;
    }}
    .app-platform {{
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 12px;
    }}
    .watch-platform {{ color: #EF4444; }}
    .mobile-platform {{ color: #3B82F6; }}
    .web-platform {{ color: #A855F7; }}
    .desc {{
      font-size: 13px;
      color: #94A3B8;
      line-height: 1.5;
      margin-bottom: 20px;
    }}
    .specs {{
      width: 100%;
      background: #090D16;
      border-radius: 14px;
      padding: 12px;
      text-align: left;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #64748B;
    }}
    .spec-row {{
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }}
    .spec-row:last-child {{ margin-bottom: 0; }}
    .spec-val {{ color: #CBD5E1; font-weight: 600; }}
  </style>
</head>
<body>
  <div class="header">
    <div class="badge">Official CSP Brand System</div>
    <h1>Emergency Alert and Hospital Assistance System</h1>
    <div class="subtitle">Unified Multi-Platform Application Icon Architecture — VVIT CSE Batch 8 (VSK)</div>
  </div>

  <div class="grid">
    <!-- Watch App Card -->
    <div class="card">
      <div class="icon-wrapper">
        <img src="file:///{watch_png}" alt="Watch App Icon" />
      </div>
      <div class="app-title">VVIT CSP Watch</div>
      <div class="app-platform watch-platform">Wear OS Smartwatch</div>
      <div class="desc">Autonomous 50Hz IMU accident &amp; fall detection with circular dial radar, tactile crown, and life-sign ECG pulse.</div>
      <div class="specs">
        <div class="spec-row"><span>Accent:</span><span class="spec-val">Crimson #B71C1C</span></div>
        <div class="spec-row"><span>Format:</span><span class="spec-val">Wear OS Adaptive</span></div>
        <div class="spec-row"><span>Safe Area:</span><span class="spec-val">Round &amp; Squircle</span></div>
      </div>
    </div>

    <!-- Mobile App Card -->
    <div class="card">
      <div class="icon-wrapper">
        <img src="file:///{mobile_png}" alt="Mobile App Icon" />
      </div>
      <div class="app-title">Emergency Alert</div>
      <div class="app-platform mobile-platform">Flutter Mobile (Android/iOS)</div>
      <div class="desc">Smartphone silhouette with integrated GPS emergency cross, dynamic island, and continuous ECG heart telemetry.</div>
      <div class="specs">
        <div class="spec-row"><span>Accent:</span><span class="spec-val">Trust Blue #1565C0</span></div>
        <div class="spec-row"><span>Format:</span><span class="spec-val">Android Mipmap + iOS</span></div>
        <div class="spec-row"><span>Telemetry:</span><span class="spec-val">GPS Beacon + ECG</span></div>
      </div>
    </div>

    <!-- Web App Card -->
    <div class="card">
      <div class="icon-wrapper">
        <img src="file:///{web_png}" alt="Web App Icon" />
      </div>
      <div class="app-title">Emergency Alert &amp; Assistance</div>
      <div class="app-platform web-platform">React + Vite Web Command</div>
      <div class="desc">Multi-role coordination monitor linking 4 quadrant nodes (Admin, Hospital, Responder, Citizen) with central clinical cross.</div>
      <div class="specs">
        <div class="spec-row"><span>Accent:</span><span class="spec-val">Deep Purple #4527A0</span></div>
        <div class="spec-row"><span>Format:</span><span class="spec-val">Favicon, PWA &amp; Apple</span></div>
        <div class="spec-row"><span>Nexus:</span><span class="spec-val">4-Role Topology</span></div>
      </div>
    </div>
  </div>
</body>
</html>"""

with open(PREVIEW_HTML, "w", encoding="utf-8") as f:
    f.write(html)

temp_user_data = os.path.join(os.environ.get("TEMP", "C:\\temp"), f"chrome_preview_{int(time.time()*1000)}")
preview_html_url = os.path.abspath(PREVIEW_HTML).replace("\\", "/")

cmd = [
    CHROME_PATH,
    "--headless",
    "--disable-gpu",
    f"--user-data-dir={temp_user_data}",
    "--window-size=1200,800",
    f"--screenshot={PREVIEW_PNG}",
    f"file:///{preview_html_url}"
]
subprocess.run(cmd, capture_output=True, text=True)
if os.path.exists(PREVIEW_PNG):
    print(f"Generated brand preview showcase: {PREVIEW_PNG}")
