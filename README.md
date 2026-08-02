# eMasjid Display

Paparan web jam solat gaya TV masjid/surau dengan data waktu solat harian daripada API e-Solat JAKIM.

## Ciri-ciri

- Jam digital besar, tarikh Masihi, dan tarikh Hijrah.
- Waktu solat harian: Imsak, Subuh, Syuruk, Zohor, Asar, Maghrib, dan Isyak.
- Pilihan zon waktu solat Malaysia seperti Putrajaya/Kuala Lumpur, Selangor, Johor, Kedah, Kelantan, Melaka, Pulau Pinang, Perak, Sabah, dan Sarawak.
- Sambungan live kepada endpoint e-Solat JAKIM dan refresh automatik setiap jam serta selepas tengah malam supaya waktu solat dikemas kini setiap hari.
- Paparan azan apabila masuk waktu solat dan countdown iqamah mengikut minit yang ditetapkan.
- Notice berjalan untuk pesanan seperti “Sila senyapkan telefon anda”.
- Ruang pengumuman kalendar Islam seperti Hari Raya, Ramadan, atau program masjid.
- Page admin `admin.html` untuk ubah nama masjid, slideshow, sumber JAKIM/manual, zon negeri, custom azan, iqamah, notis, dan countdown sebelum azan.
- Folder khas `assets/images/` untuk tukar gambar latar paparan.

## Cara guna

1. Buka `index.html` dalam pelayar web moden.
2. Buka `admin.html` untuk tetapan penuh.
3. Pilih zon masa/waktu solat negeri dan sama ada guna live JAKIM atau waktu manual.
4. Tetapkan nama masjid, gambar slideshow, minit sebelum azan, custom audio azan, minit iqamah, notice, dan hari kebesaran.
5. Letakkan gambar latar sendiri dalam `assets/images/` dan masukkan path gambar di page admin.

> Nota: Sambungan internet diperlukan kerana waktu solat diambil daripada API e-Solat JAKIM.

## Installer Raspberry Pi 5

Installer ini sesuai untuk Raspberry Pi OS Desktop pada Raspberry Pi 5. Ia akan:

- pasang dependency asas (`python3`, `rsync`, `unclutter`, `x11-xserver-utils`, dan Chromium) serta sahkan binary Chromium wujud,
- salin aplikasi ke `/opt/emasjid-display`,
- cipta service `emasjid-display` untuk web server tempatan,
- cipta service `emasjid-display-kiosk` untuk buka Chromium fullscreen selepas boot,
- aktifkan auto-run menggunakan systemd.

Jalankan arahan ini pada Raspberry Pi:

```bash
sudo bash scripts/install-raspberry-pi.sh
```

Selepas install, paparan boleh dibuka di:

```text
http://127.0.0.1:8080/index.html
```

Semak service:

```bash
sudo systemctl status emasjid-display
sudo systemctl status emasjid-display-kiosk
```

Pilihan install:

```bash
# Tukar port atau user
sudo APP_PORT=8090 SERVICE_USER=pi bash scripts/install-raspberry-pi.sh

# Install server sahaja tanpa Chromium kiosk
sudo INSTALL_KIOSK=0 bash scripts/install-raspberry-pi.sh
```
