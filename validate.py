#!/usr/bin/env python3
"""
Validates manifest.json integrity and checks that all referenced files exist.
Exit code 0 = all checks passed, 1 = failures found.
"""

import json
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
MANIFEST_PATH = os.path.join(ROOT, "manifest.json")

PASS = "\033[32m✓\033[0m"
FAIL = "\033[31m✗\033[0m"
WARN = "\033[33m!\033[0m"

errors = []
warnings = []


def check(label, ok, message=""):
    if ok:
        print(f"  {PASS} {label}")
    else:
        print(f"  {FAIL} {label}" + (f": {message}" if message else ""))
        errors.append(label)


def warn(label, message=""):
    print(f"  {WARN} {label}" + (f": {message}" if message else ""))
    warnings.append(label)


def file_exists(rel_path):
    return os.path.isfile(os.path.join(ROOT, rel_path))


# ── 1. Parse manifest ────────────────────────────────────────────────────────
print("\n[1/4] Parsing manifest.json")
try:
    with open(MANIFEST_PATH) as f:
        manifest = json.load(f)
    print(f"  {PASS} Valid JSON")
except FileNotFoundError:
    print(f"  {FAIL} manifest.json not found")
    sys.exit(1)
except json.JSONDecodeError as e:
    print(f"  {FAIL} Invalid JSON: {e}")
    sys.exit(1)


# ── 2. Required fields ───────────────────────────────────────────────────────
print("\n[2/4] Required manifest fields")
check("manifest_version present", "manifest_version" in manifest)
check("manifest_version is 3", manifest.get("manifest_version") == 3,
      f"got {manifest.get('manifest_version')}")
check("name present", bool(manifest.get("name")))
check("version present", bool(manifest.get("version")))
check("description present", bool(manifest.get("description")))

version = manifest.get("version", "")
parts = version.split(".")
check(
    f"version format valid ({version})",
    all(p.isdigit() for p in parts) and 1 <= len(parts) <= 4,
    "must be 1-4 dot-separated integers"
)

permissions = manifest.get("permissions", [])
known_permissions = {
    "activeTab", "alarms", "background", "bookmarks", "browsingData",
    "clipboardRead", "clipboardWrite", "contentSettings", "contextMenus",
    "cookies", "debugger", "declarativeContent", "declarativeNetRequest",
    "declarativeNetRequestFeedback", "desktopCapture", "downloads",
    "downloads.open", "downloads.shelf", "downloads.ui", "enterprise.deviceAttributes",
    "enterprise.hardwarePlatform", "enterprise.networkingAttributes",
    "enterprise.platformKeys", "fileBrowserHandler", "fileSystemProvider",
    "fontSettings", "gcm", "geolocation", "history", "identity",
    "idle", "loginState", "management", "nativeMessaging", "notifications",
    "offscreen", "pageCapture", "platformKeys", "power", "printerProvider",
    "printing", "printingMetrics", "privacy", "processes", "proxy",
    "readingList", "scripting", "search", "sessions", "sidePanel",
    "storage", "system.cpu", "system.display", "system.memory",
    "system.storage", "tabCapture", "tabGroups", "tabs", "topSites",
    "tts", "ttsEngine", "unlimitedStorage", "vpnProvider", "wallpaper",
    "webAuthenticationProxy", "webNavigation", "webRequest",
}
for perm in permissions:
    if perm.startswith("http") or perm.startswith("file"):
        pass  # host permission, fine
    else:
        check(f"permission '{perm}' is known", perm in known_permissions)


# ── 3. File references ───────────────────────────────────────────────────────
print("\n[3/4] File references")

# background service worker
sw = manifest.get("background", {}).get("service_worker")
if sw:
    check(f"background.service_worker '{sw}'", file_exists(sw))
else:
    warn("No background.service_worker defined")

# action popup + icons
action = manifest.get("action", {})
popup = action.get("default_popup")
if popup:
    check(f"action.default_popup '{popup}'", file_exists(popup))

for size, path in action.get("default_icon", {}).items():
    check(f"action.default_icon[{size}] '{path}'", file_exists(path))

# top-level icons
for size, path in manifest.get("icons", {}).items():
    check(f"icons[{size}] '{path}'", file_exists(path))

# content scripts
for i, cs in enumerate(manifest.get("content_scripts", [])):
    for js in cs.get("js", []):
        check(f"content_scripts[{i}].js '{js}'", file_exists(js))
    for css in cs.get("css", []):
        check(f"content_scripts[{i}].css '{css}'", file_exists(css))

# web accessible resources
for i, entry in enumerate(manifest.get("web_accessible_resources", [])):
    for res in entry.get("resources", []):
        if "*" not in res and "?" not in res:
            check(f"web_accessible_resources[{i}] '{res}'", file_exists(res))

# options page / sidebar
for key in ("options_page", "options_ui", "side_panel"):
    val = manifest.get(key)
    if isinstance(val, dict):
        val = val.get("page") or val.get("default_path")
    if val:
        check(f"{key} '{val}'", file_exists(val))


# ── 4. Consistency checks ────────────────────────────────────────────────────
print("\n[4/4] Consistency")

# CSP: warn about unsafe directives
csp = manifest.get("content_security_policy", {})
for ctx, policy in csp.items():
    for unsafe in ("'unsafe-eval'", "'unsafe-inline'", "data:"):
        if unsafe in policy:
            warn(f"CSP[{ctx}] contains {unsafe}")

# MV3: background must be service_worker, not scripts
bg = manifest.get("background", {})
if "scripts" in bg:
    check("MV3: background uses service_worker (not scripts array)", False,
          "background.scripts is MV2 syntax")

# Warn about host_permissions vs permissions mixing
host_perms = manifest.get("host_permissions", [])
perms_with_hosts = [p for p in permissions if p.startswith("http") or p.startswith("file")]
if perms_with_hosts:
    warn("Host patterns found in 'permissions' — prefer 'host_permissions' in MV3",
         ", ".join(perms_with_hosts))

# Popup HTML references popup.js and popup.css
popup_html_path = os.path.join(ROOT, "popup.html")
if os.path.isfile(popup_html_path):
    with open(popup_html_path) as f:
        html = f.read()
    for asset in ("popup.js", "popup.css"):
        if asset in html:
            check(f"popup.html references {asset}", file_exists(asset))
        else:
            warn(f"popup.html does not reference {asset}")

    mathjax_refs = [line.strip() for line in html.splitlines()
                    if "tex-svg" in line or "mathjax" in line.lower()]
    if mathjax_refs:
        for ref in mathjax_refs:
            # extract src="..." value
            import re
            srcs = re.findall(r'src=["\']([^"\']+)["\']', ref)
            for src in srcs:
                if not src.startswith("http"):
                    check(f"popup.html script src '{src}'", file_exists(src))


# ── Summary ──────────────────────────────────────────────────────────────────
print()
if errors:
    print(f"\033[31mFAILED\033[0m — {len(errors)} error(s), {len(warnings)} warning(s)")
    for e in errors:
        print(f"  • {e}")
    sys.exit(1)
else:
    status = f"\033[32mPASSED\033[0m"
    w = f", {len(warnings)} warning(s)" if warnings else ""
    print(f"{status} — all checks passed{w}")
    sys.exit(0)
