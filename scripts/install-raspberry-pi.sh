#!/usr/bin/env bash
set -euo pipefail

APP_NAME="emasjid-display"
APP_DIR="${APP_DIR:-/opt/emasjid-display}"
APP_PORT="${APP_PORT:-8080}"
CHROMIUM_BIN="${CHROMIUM_BIN:-/usr/bin/chromium-browser}"
SERVICE_USER="${SERVICE_USER:-pi}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_KIOSK="${INSTALL_KIOSK:-1}"

log() { printf '\033[1;32m[emasjid]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[emasjid]\033[0m %s\n' "$*"; }
require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    echo "Sila run installer dengan sudo: sudo bash scripts/install-raspberry-pi.sh" >&2
    exit 1
  fi
}
copy_app() {
  log "Menyalin aplikasi ke ${APP_DIR}"
  install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" "${APP_DIR}"
  rsync -a --delete \
    --exclude '.git' \
    --exclude 'systemd/*.service.generated' \
    "${REPO_DIR}/" "${APP_DIR}/"
  chown -R "${SERVICE_USER}:${SERVICE_USER}" "${APP_DIR}"
}
install_packages() {
  log "Memasang pakej Raspberry Pi OS yang diperlukan"
  apt-get update
  apt-get install -y python3 rsync unclutter x11-xserver-utils
  if [[ "${INSTALL_KIOSK}" == "1" ]]; then
    apt-get install -y chromium-browser || apt-get install -y chromium
    if [[ ! -x "${CHROMIUM_BIN}" && -x /usr/bin/chromium ]]; then
      CHROMIUM_BIN=/usr/bin/chromium
    fi
  fi
}
write_display_service() {
  log "Menulis service web display"
  cat >/etc/systemd/system/${APP_NAME}.service <<SERVICE
[Unit]
Description=eMasjid Display static web server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${APP_DIR}
Environment=PYTHONUNBUFFERED=1
ExecStart=/usr/bin/python3 -m http.server ${APP_PORT} --bind 0.0.0.0
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE
}
write_kiosk_service() {
  if [[ "${INSTALL_KIOSK}" != "1" ]]; then
    warn "INSTALL_KIOSK=0, kiosk Chromium tidak dipasang."
    return
  fi

  log "Menulis service kiosk Chromium"
  cat >/etc/systemd/system/${APP_NAME}-kiosk.service <<SERVICE
[Unit]
Description=eMasjid Display Chromium kiosk
After=graphical.target ${APP_NAME}.service
Wants=${APP_NAME}.service

[Service]
Type=simple
User=${SERVICE_USER}
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/${SERVICE_USER}/.Xauthority
ExecStartPre=/bin/sh -c 'xset -display :0 s off -dpms || true'
ExecStartPre=/bin/sh -c 'unclutter -display :0 -idle 1 -root &'
ExecStart=${CHROMIUM_BIN} --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble --check-for-update-interval=31536000 http://127.0.0.1:${APP_PORT}/index.html
Restart=always
RestartSec=5

[Install]
WantedBy=graphical.target
SERVICE
}
enable_services() {
  log "Mengaktifkan auto-run selepas boot"
  systemctl daemon-reload
  systemctl enable --now ${APP_NAME}.service
  if [[ "${INSTALL_KIOSK}" == "1" ]]; then
    systemctl enable ${APP_NAME}-kiosk.service
    systemctl restart ${APP_NAME}-kiosk.service || warn "Kiosk belum boleh start. Pastikan Raspberry Pi boot ke Desktop/graphical session."
  fi
}
print_summary() {
  cat <<SUMMARY

Selesai.
- Web display: http://127.0.0.1:${APP_PORT}/index.html
- Folder aplikasi: ${APP_DIR}
- Folder gambar: ${APP_DIR}/assets/images/background.jpg
- Service web: sudo systemctl status ${APP_NAME}
- Service kiosk: sudo systemctl status ${APP_NAME}-kiosk

Untuk tukar port/user/Chromium:
  sudo APP_PORT=8090 SERVICE_USER=pi CHROMIUM_BIN=/usr/bin/chromium bash scripts/install-raspberry-pi.sh

Untuk server sahaja tanpa Chromium kiosk:
  sudo INSTALL_KIOSK=0 bash scripts/install-raspberry-pi.sh
SUMMARY
}

require_root
install_packages
copy_app
write_display_service
write_kiosk_service
enable_services
print_summary
