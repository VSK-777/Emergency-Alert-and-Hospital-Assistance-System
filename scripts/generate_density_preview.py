import os
import subprocess
import time

BASE_DIR = r"C:\Users\Lenovo\Desktop\VSK\B.Tech\CSP\Emergency Alert and Hospital Assistance System"
DOCS_BRANDING = os.path.join(BASE_DIR, "docs", "branding")
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
MULTI_PREVIEW_HTML = os.path.join(DOCS_BRANDING, "density_preview.html")
MULTI_PREVIEW_PNG = os.path.join(DOCS_BRANDING, "density_preview.png")

def get_rel_url(sub_path):
    return os.path.join(DOCS_BRANDING, sub_path).replace("\\", "/")

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Launcher Icon Density Scale Verification</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: #0B0F19;
      color: #F8FAFC;
      font-family: 'Plus Jakarta Sans', sans-serif;
      padding: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }}
    h1 {{
      font-size: 26px;
      font-weight: 800;
      margin-bottom: 8px;
      color: #FFFFFF;
    }}
    .subtitle {{
      color: #64748B;
      font-size: 14px;
      margin-bottom: 32px;
    }}
    .table-container {{
      background: #111827;
      border: 1px solid #1F2937;
      border-radius: 20px;
      padding: 24px;
      width: 100%;
      max-width: 1000px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      text-align: center;
    }}
    th {{
      color: #9CA3AF;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 8px;
      border-bottom: 1px solid #374151;
    }}
    td {{
      padding: 16px 8px;
      vertical-align: middle;
      border-bottom: 1px solid #1F2937;
    }}
    .label-col {{
      text-align: left;
      font-weight: 700;
      font-size: 15px;
      color: #E2E8F0;
    }}
    .badge {{
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 6px;
      background: #1F2937;
      color: #94A3B8;
      margin-top: 4px;
    }}
    .icon-cell {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #030712;
      border: 1px solid #1F2937;
      border-radius: 12px;
      padding: 6px;
    }}
    .icon-cell img {{
      display: block;
      image-rendering: auto;
    }}
    .round-cell {{
      border-radius: 9999px;
    }}
    .round-cell img {{
      border-radius: 9999px;
    }}
  </style>
</head>
<body>
  <h1>Density Scale &amp; Legibility Verification</h1>
  <div class="subtitle">Multi-Resolution Verification from 16px Favicon to 192px xxxhdpi Launcher</div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th style="width: 200px; text-align: left;">Application</th>
          <th>192px (xxxhdpi)</th>
          <th>144px (xxhdpi)</th>
          <th>96px (xhdpi)</th>
          <th>72px (hdpi)</th>
          <th>48px (mdpi)</th>
          <th>32px / 16px</th>
        </tr>
      </thead>
      <tbody>
        <!-- Watch App Row -->
        <tr>
          <td class="label-col">
            <div>VVIT CSP Watch</div>
            <div class="badge">Wear OS Round/Sq</div>
          </td>
          <td>
            <div class="icon-cell round-cell"><img src="file:///{get_rel_url('watch-app/png/watch_icon_192.png')}" width="72" height="72" /></div>
          </td>
          <td>
            <div class="icon-cell round-cell"><img src="file:///{get_rel_url('watch-app/png/watch_icon_144.png')}" width="54" height="54" /></div>
          </td>
          <td>
            <div class="icon-cell round-cell"><img src="file:///{get_rel_url('watch-app/png/watch_icon_96.png')}" width="42" height="42" /></div>
          </td>
          <td>
            <div class="icon-cell round-cell"><img src="file:///{get_rel_url('watch-app/png/watch_icon_72.png')}" width="32" height="32" /></div>
          </td>
          <td>
            <div class="icon-cell round-cell"><img src="file:///{get_rel_url('watch-app/png/watch_icon_48.png')}" width="24" height="24" /></div>
          </td>
          <td>
            <div class="icon-cell round-cell"><img src="file:///{get_rel_url('watch-app/png/watch_icon_36.png')}" width="18" height="18" /></div>
          </td>
        </tr>

        <!-- Mobile App Row -->
        <tr>
          <td class="label-col">
            <div>Emergency Alert</div>
            <div class="badge">Flutter Mobile</div>
          </td>
          <td>
            <div class="icon-cell"><img src="file:///{get_rel_url('mobile-app/png/mobile_icon_192.png')}" width="72" height="72" style="border-radius: 16px;" /></div>
          </td>
          <td>
            <div class="icon-cell"><img src="file:///{get_rel_url('mobile-app/png/mobile_icon_144.png')}" width="54" height="54" style="border-radius: 12px;" /></div>
          </td>
          <td>
            <div class="icon-cell"><img src="file:///{get_rel_url('mobile-app/png/mobile_icon_96.png')}" width="42" height="42" style="border-radius: 9px;" /></div>
          </td>
          <td>
            <div class="icon-cell"><img src="file:///{get_rel_url('mobile-app/png/mobile_icon_72.png')}" width="32" height="32" style="border-radius: 7px;" /></div>
          </td>
          <td>
            <div class="icon-cell"><img src="file:///{get_rel_url('mobile-app/png/mobile_icon_48.png')}" width="24" height="24" style="border-radius: 5px;" /></div>
          </td>
          <td>
            <div class="icon-cell"><img src="file:///{get_rel_url('mobile-app/png/mobile_icon_48.png')}" width="16" height="16" style="border-radius: 3px;" /></div>
          </td>
        </tr>

        <!-- Web App Row -->
        <tr>
          <td class="label-col">
            <div>Emergency Alert &amp; Asst.</div>
            <div class="badge">Web Favicon / PWA</div>
          </td>
          <td>
            <div class="icon-cell"><img src="file:///{get_rel_url('web-app/png/web_icon_192.png')}" width="72" height="72" style="border-radius: 16px;" /></div>
          </td>
          <td>
            <div class="icon-cell"><img src="file:///{get_rel_url('web-app/png/web_icon_128.png')}" width="54" height="54" style="border-radius: 12px;" /></div>
          </td>
          <td>
            <div class="icon-cell"><img src="file:///{get_rel_url('web-app/png/web_icon_64.png')}" width="42" height="42" style="border-radius: 9px;" /></div>
          </td>
          <td>
            <div class="icon-cell"><img src="file:///{get_rel_url('web-app/png/web_icon_48.png')}" width="32" height="32" style="border-radius: 7px;" /></div>
          </td>
          <td>
            <div class="icon-cell"><img src="file:///{get_rel_url('web-app/png/web_icon_32.png')}" width="24" height="24" style="border-radius: 5px;" /></div>
          </td>
          <td>
            <div class="icon-cell"><img src="file:///{get_rel_url('web-app/png/web_icon_16.png')}" width="16" height="16" style="border-radius: 3px;" /></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>"""

with open(MULTI_PREVIEW_HTML, "w", encoding="utf-8") as f:
    f.write(html)

temp_user_data = os.path.join(os.environ.get("TEMP", "C:\\temp"), f"chrome_multi_{int(time.time()*1000)}")
preview_html_url = os.path.abspath(MULTI_PREVIEW_HTML).replace("\\", "/")

cmd = [
    CHROME_PATH,
    "--headless",
    "--disable-gpu",
    f"--user-data-dir={temp_user_data}",
    "--window-size=1100,600",
    f"--screenshot={MULTI_PREVIEW_PNG}",
    f"file:///{preview_html_url}"
]
subprocess.run(cmd, capture_output=True, text=True)
if os.path.exists(MULTI_PREVIEW_PNG):
    print(f"Generated multi-density preview: {MULTI_PREVIEW_PNG}")
