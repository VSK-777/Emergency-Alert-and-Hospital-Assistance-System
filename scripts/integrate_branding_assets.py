import os
import shutil
import json
from PIL import Image, ImageDraw

BASE_DIR = r"C:\Users\Lenovo\Desktop\VSK\B.Tech\CSP\Emergency Alert and Hospital Assistance System"
DOCS_BRANDING = os.path.join(BASE_DIR, "docs", "branding")

WATCH_RES = os.path.join(BASE_DIR, "Smart Watch App", "app", "src", "main", "res")
WATCH_MANIFEST = os.path.join(BASE_DIR, "Smart Watch App", "app", "src", "main", "AndroidManifest.xml")

MOBILE_RES = os.path.join(BASE_DIR, "Mobile App", "android", "app", "src", "main", "res")
MOBILE_MANIFEST = os.path.join(BASE_DIR, "Mobile App", "android", "app", "src", "main", "AndroidManifest.xml")
MOBILE_IOS_ICONS = os.path.join(BASE_DIR, "Mobile App", "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset")

WEB_PUBLIC = os.path.join(BASE_DIR, "Web App", "public")
WEB_INDEX_HTML = os.path.join(BASE_DIR, "Web App", "index.html")

def make_round_icon(src_img, size):
    """Creates a circular masked icon for Android roundIcon requirements."""
    resized = src_img.resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    output.paste(resized, (0, 0), mask=mask)
    return output

# ==========================================
# 1. INTEGRATE WATCH APP ASSETS
# ==========================================
def integrate_watch_app():
    print(">>> Integrating Watch App Launcher Assets...")
    master_watch_png = Image.open(os.path.join(DOCS_BRANDING, "watch-app", "master", "watch_icon_1024.png"))
    fg_watch_png = Image.open(os.path.join(DOCS_BRANDING, "watch-app", "adaptive", "watch_foreground_1024.png"))

    densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192
    }

    # 1.1 Generate raster mipmaps (square & round)
    for folder, size in densities.items():
        target_dir = os.path.join(WATCH_RES, folder)
        os.makedirs(target_dir, exist_ok=True)
        # Square launcher
        sq = master_watch_png.resize((size, size), Image.Resampling.LANCZOS)
        sq.save(os.path.join(target_dir, "ic_launcher.png"))
        # Round launcher
        rd = make_round_icon(master_watch_png, size)
        rd.save(os.path.join(target_dir, "ic_launcher_round.png"))
        print(f"  Watch {folder}: {size}x{size} (sq & rd)")

    # 1.2 Generate adaptive foreground layers
    adaptive_fg_sizes = {
        "drawable-mdpi": 108,
        "drawable-hdpi": 162,
        "drawable-xhdpi": 216,
        "drawable-xxhdpi": 324,
        "drawable-xxxhdpi": 432
    }
    for folder, size in adaptive_fg_sizes.items():
        target_dir = os.path.join(WATCH_RES, folder)
        os.makedirs(target_dir, exist_ok=True)
        fg_resized = fg_watch_png.resize((size, size), Image.Resampling.LANCZOS)
        fg_resized.save(os.path.join(target_dir, "ic_launcher_foreground.png"))

    # Also root drawable/ic_launcher_foreground.png
    drawable_dir = os.path.join(WATCH_RES, "drawable")
    os.makedirs(drawable_dir, exist_ok=True)
    fg_watch_png.resize((432, 432), Image.Resampling.LANCZOS).save(os.path.join(drawable_dir, "ic_launcher_foreground.png"))

    # 1.3 Write drawable/ic_launcher_background.xml
    bg_xml = """<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:aapt="http://schemas.android.com/aapt"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path android:pathData="M0,0h108v108h-108z">
        <aapt:attr name="android:fillColor">
            <gradient
                android:startX="54"
                android:startY="0"
                android:endX="54"
                android:endY="108"
                android:type="linear">
                <item android:color="#E53935" android:offset="0.0" />
                <item android:color="#B71C1C" android:offset="0.5" />
                <item android:color="#1A0507" android:offset="1.0" />
            </gradient>
        </aapt:attr>
    </path>
</vector>"""
    with open(os.path.join(drawable_dir, "ic_launcher_background.xml"), "w", encoding="utf-8") as f:
        f.write(bg_xml)

    # 1.4 Write drawable/ic_launcher_monochrome.xml
    mono_xml = """<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:pathData="M 54,27 A 27,27 0 1,1 53.9,27"
        android:strokeColor="#FFFFFF"
        android:strokeWidth="2.5" />
    <path
        android:pathData="M 35,56 L 43,56 L 45,52 L 48,60 L 51,38 L 55,68 L 58,51 L 61,59 L 63,56 L 73,56"
        android:strokeColor="#FFFFFF"
        android:strokeWidth="2.2"
        android:strokeLineCap="round"
        android:strokeLineJoin="round" />
</vector>"""
    with open(os.path.join(drawable_dir, "ic_launcher_monochrome.xml"), "w", encoding="utf-8") as f:
        f.write(mono_xml)

    # 1.5 Write mipmap-anydpi-v26/ic_launcher.xml & ic_launcher_round.xml
    anydpi_dir = os.path.join(WATCH_RES, "mipmap-anydpi-v26")
    os.makedirs(anydpi_dir, exist_ok=True)
    adaptive_xml = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
    <monochrome android:drawable="@drawable/ic_launcher_monochrome" />
</adaptive-icon>"""
    with open(os.path.join(anydpi_dir, "ic_launcher.xml"), "w", encoding="utf-8") as f:
        f.write(adaptive_xml)
    with open(os.path.join(anydpi_dir, "ic_launcher_round.xml"), "w", encoding="utf-8") as f:
        f.write(adaptive_xml)

    # 1.6 Update AndroidManifest.xml
    with open(WATCH_MANIFEST, "r", encoding="utf-8") as f:
        manifest_content = f.read()

    manifest_content = manifest_content.replace(
        'android:icon="@android:drawable/ic_dialog_alert"',
        'android:icon="@mipmap/ic_launcher"\n        android:roundIcon="@mipmap/ic_launcher_round"'
    )
    manifest_content = manifest_content.replace(
        'android:label="VVIT Watch Emergency"',
        'android:label="VVIT CSP Watch"'
    )
    with open(WATCH_MANIFEST, "w", encoding="utf-8") as f:
        f.write(manifest_content)
    print("  Updated Smart Watch App AndroidManifest.xml (icon, roundIcon, label: VVIT CSP Watch)")

# ==========================================
# 2. INTEGRATE FLUTTER MOBILE APP ASSETS
# ==========================================
def integrate_mobile_app():
    print("\n>>> Integrating Flutter Mobile App Launcher Assets...")
    master_mobile_png = Image.open(os.path.join(DOCS_BRANDING, "mobile-app", "master", "mobile_icon_1024.png"))
    fg_mobile_png = Image.open(os.path.join(DOCS_BRANDING, "mobile-app", "android", "mobile_foreground_1024.png"))

    densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192
    }

    # 2.1 Update Android mipmaps
    for folder, size in densities.items():
        target_dir = os.path.join(MOBILE_RES, folder)
        os.makedirs(target_dir, exist_ok=True)
        sq = master_mobile_png.resize((size, size), Image.Resampling.LANCZOS)
        sq.save(os.path.join(target_dir, "ic_launcher.png"))
        print(f"  Mobile {folder}: {size}x{size}")

    # 2.2 Generate adaptive foreground layers
    adaptive_fg_sizes = {
        "drawable-mdpi": 108,
        "drawable-hdpi": 162,
        "drawable-xhdpi": 216,
        "drawable-xxhdpi": 324,
        "drawable-xxxhdpi": 432
    }
    for folder, size in adaptive_fg_sizes.items():
        target_dir = os.path.join(MOBILE_RES, folder)
        os.makedirs(target_dir, exist_ok=True)
        fg_resized = fg_mobile_png.resize((size, size), Image.Resampling.LANCZOS)
        fg_resized.save(os.path.join(target_dir, "ic_launcher_foreground.png"))

    drawable_dir = os.path.join(MOBILE_RES, "drawable")
    os.makedirs(drawable_dir, exist_ok=True)
    fg_mobile_png.resize((432, 432), Image.Resampling.LANCZOS).save(os.path.join(drawable_dir, "ic_launcher_foreground.png"))

    # 2.3 Write drawable/ic_launcher_background.xml
    bg_xml = """<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:aapt="http://schemas.android.com/aapt"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path android:pathData="M0,0h108v108h-108z">
        <aapt:attr name="android:fillColor">
            <gradient
                android:startX="54"
                android:startY="0"
                android:endX="54"
                android:endY="108"
                android:type="linear">
                <item android:color="#1E88E5" android:offset="0.0" />
                <item android:color="#1565C0" android:offset="0.4" />
                <item android:color="#0A192F" android:offset="1.0" />
            </gradient>
        </aapt:attr>
    </path>
</vector>"""
    with open(os.path.join(drawable_dir, "ic_launcher_background.xml"), "w", encoding="utf-8") as f:
        f.write(bg_xml)

    # 2.4 Write drawable/ic_launcher_monochrome.xml
    mono_xml = """<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:pathData="M 35,23 L 73,23 A 6,6 0 0,1 79,29 L 79,79 A 6,6 0 0,1 73,85 L 35,85 A 6,6 0 0,1 29,79 L 29,29 A 6,6 0 0,1 35,23 Z"
        android:strokeColor="#FFFFFF"
        android:strokeWidth="2.5" />
    <path
        android:pathData="M 32,58 L 43,58 L 46,54 L 49,63 L 52,36 L 56,72 L 60,52 L 62,60 L 65,58 L 76,58"
        android:strokeColor="#FFFFFF"
        android:strokeWidth="2.2"
        android:strokeLineCap="round"
        android:strokeLineJoin="round" />
</vector>"""
    with open(os.path.join(drawable_dir, "ic_launcher_monochrome.xml"), "w", encoding="utf-8") as f:
        f.write(mono_xml)

    # 2.5 Write mipmap-anydpi-v26/ic_launcher.xml
    anydpi_dir = os.path.join(MOBILE_RES, "mipmap-anydpi-v26")
    os.makedirs(anydpi_dir, exist_ok=True)
    adaptive_xml = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
    <monochrome android:drawable="@drawable/ic_launcher_monochrome" />
</adaptive-icon>"""
    with open(os.path.join(anydpi_dir, "ic_launcher.xml"), "w", encoding="utf-8") as f:
        f.write(adaptive_xml)

    # 2.6 Update iOS Assets if present
    if os.path.exists(MOBILE_IOS_ICONS):
        ios_files = {
            "Icon-App-20x20@1x.png": 20,
            "Icon-App-20x20@2x.png": 40,
            "Icon-App-20x20@3x.png": 60,
            "Icon-App-29x29@1x.png": 29,
            "Icon-App-29x29@2x.png": 58,
            "Icon-App-29x29@3x.png": 87,
            "Icon-App-40x40@1x.png": 40,
            "Icon-App-40x40@2x.png": 80,
            "Icon-App-40x40@3x.png": 120,
            "Icon-App-60x60@2x.png": 120,
            "Icon-App-60x60@3x.png": 180,
            "Icon-App-76x76@1x.png": 76,
            "Icon-App-76x76@2x.png": 152,
            "Icon-App-83.5x83.5@2x.png": 167,
            "Icon-App-1024x1024@1x.png": 1024,
        }
        for fname, size in ios_files.items():
            resized = master_mobile_png.resize((size, size), Image.Resampling.LANCZOS)
            resized.save(os.path.join(MOBILE_IOS_ICONS, fname))
        print("  Updated iOS Assets.xcassets AppIcon set (15 files)")

    # 2.7 Update AndroidManifest.xml label
    with open(MOBILE_MANIFEST, "r", encoding="utf-8") as f:
        m_content = f.read()
    m_content = m_content.replace(
        'android:label="Emergency Alert and Hospital Assistance System"',
        'android:label="Emergency Alert"'
    )
    with open(MOBILE_MANIFEST, "w", encoding="utf-8") as f:
        f.write(m_content)
    print("  Updated Flutter Mobile AndroidManifest.xml (label: Emergency Alert)")

# ==========================================
# 3. INTEGRATE REACT WEB APP ASSETS
# ==========================================
def integrate_web_app():
    print("\n>>> Integrating React Web App Branding Assets...")
    
    # 3.1 Copy favicon files to Web App/public
    shutil.copy(
        os.path.join(DOCS_BRANDING, "web-app", "svg", "web_icon_favicon.svg"),
        os.path.join(WEB_PUBLIC, "favicon.svg")
    )
    shutil.copy(
        os.path.join(DOCS_BRANDING, "web-app", "favicon", "favicon.ico"),
        os.path.join(WEB_PUBLIC, "favicon.ico")
    )
    shutil.copy(
        os.path.join(DOCS_BRANDING, "web-app", "favicon", "favicon-16x16.png"),
        os.path.join(WEB_PUBLIC, "favicon-16x16.png")
    )
    shutil.copy(
        os.path.join(DOCS_BRANDING, "web-app", "favicon", "favicon-32x32.png"),
        os.path.join(WEB_PUBLIC, "favicon-32x32.png")
    )
    shutil.copy(
        os.path.join(DOCS_BRANDING, "web-app", "favicon", "apple-touch-icon.png"),
        os.path.join(WEB_PUBLIC, "apple-touch-icon.png")
    )
    shutil.copy(
        os.path.join(DOCS_BRANDING, "web-app", "favicon", "pwa-192x192.png"),
        os.path.join(WEB_PUBLIC, "pwa-192x192.png")
    )
    shutil.copy(
        os.path.join(DOCS_BRANDING, "web-app", "favicon", "pwa-512x512.png"),
        os.path.join(WEB_PUBLIC, "pwa-512x512.png")
    )

    # 3.2 Write Web App manifest.json
    manifest = {
        "name": "Emergency Alert & Hospital Assistance System",
        "short_name": "Emergency Alert",
        "description": "Central Emergency Alert and Hospital Assistance Platform - VVIT B.Tech CSE Community Service Project (VSK)",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#090D16",
        "theme_color": "#4527A0",
        "icons": [
            {
                "src": "/favicon-32x32.png",
                "sizes": "32x32",
                "type": "image/png"
            },
            {
                "src": "/apple-touch-icon.png",
                "sizes": "180x180",
                "type": "image/png"
            },
            {
                "src": "/pwa-192x192.png",
                "sizes": "192x192",
                "type": "image/png"
            },
            {
                "src": "/pwa-512x512.png",
                "sizes": "512x512",
                "type": "image/png"
            }
        ]
    }
    with open(os.path.join(WEB_PUBLIC, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print("  Created Web App public/manifest.json")

    # 3.3 Update index.html
    with open(WEB_INDEX_HTML, "r", encoding="utf-8") as f:
        index_html = f.read()

    # Replace favicon references
    index_html = index_html.replace(
        '<link rel="icon" type="image/svg+xml" href="/vite.svg" />',
        '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n    <link rel="alternate icon" href="/favicon.ico" />\n    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />\n    <link rel="manifest" href="/manifest.json" />'
    )
    index_html = index_html.replace(
        '<title>Emergency Alert and Hospital Assistance System | VVIT CSP</title>',
        '<title>Emergency Alert &amp; Hospital Assistance | VVIT CSP</title>'
    )

    with open(WEB_INDEX_HTML, "w", encoding="utf-8") as f:
        f.write(index_html)
    print("  Updated Web App index.html with new favicon links and manifest")

if __name__ == "__main__":
    integrate_watch_app()
    integrate_mobile_app()
    integrate_web_app()
    print("\n>>> All three applications successfully integrated with new branding assets!")
