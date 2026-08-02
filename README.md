# eMasjid Display

Paparan web jam solat gaya TV masjid/surau dengan data waktu solat harian daripada API e-Solat JAKIM.

## Ciri-ciri

- Jam digital besar, tarikh Masihi, dan tarikh Hijrah.
- Waktu solat harian: Imsak, Subuh, Syuruk, Dhuha, Zohor, Asar, Maghrib, dan Isyak.
- Pilihan zon waktu solat Malaysia seperti Putrajaya/Kuala Lumpur, Selangor, Johor, Kedah, Kelantan, Melaka, Pulau Pinang, Perak, Sabah, dan Sarawak.
- Sambungan live kepada endpoint e-Solat JAKIM dan refresh automatik setiap jam serta selepas tengah malam supaya waktu solat dikemas kini setiap hari.
- Paparan azan apabila masuk waktu solat dan countdown iqamah mengikut minit yang ditetapkan.
- Notice berjalan untuk pesanan seperti “Sila senyapkan telefon anda”.
- Ruang pengumuman kalendar Islam seperti Hari Raya, Ramadan, atau program masjid.
- Page admin `admin.html` untuk ubah nama masjid, slideshow gambar/video tanpa had, sumber JAKIM/manual, zon negeri, custom azan Subuh, custom azan Zohor/Asar/Maghrib/Isyak, custom `iqamat.mp3`, iqamah, notis tanpa had, dan countdown 5 minit atau nilai custom sebelum azan.
- Mode paparan normal waktu solat sahaja, slide zon solat lain seperti Mekah/Madinah/USA/Japan, slideshow gambar/video, countdown animasi tarikh penting Islam, countdown sebelum azan, countdown iqamah selepas azan, dan paparan “sedang solat” selepas iqamah.
- Folder khas `assets/images/`, `assets/video/`, dan `assets/audio/` untuk tukar gambar, video, azan, dan iqamat.

## Cara guna

1. Buka `index.html` dalam pelayar web moden.
2. Buka `admin.html` untuk tetapan penuh.
3. Pilih zon masa/waktu solat negeri dan sama ada guna live JAKIM atau waktu manual.
4. Tetapkan nama masjid, gambar/video slideshow, minit sebelum azan, custom audio azan Subuh, custom audio azan solat lain, custom audio iqamat, minit iqamah, tempoh sedang solat, notis, dan hari kebesaran.
5. Fail media seperti `default.png`, `praying.png`, `azan.mp3`, dan `iqamat.mp3` tidak disertakan dalam repo; rujuk guide folder `assets/` untuk letak fail sendiri, kemudian masukkan path di page admin.

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


## Fail Media (Guide Sahaja)

Repo ini tidak memasukkan fail `.png`, `.mp3`, atau video sebenar. Sediakan fail sendiri pada Raspberry Pi:

- `assets/images/default.png` untuk paparan normal.
- `assets/images/praying.png` untuk paparan sedang solat.
- `assets/audio/azan-subuh.mp3` untuk audio azan Subuh.
- `assets/audio/azan.mp3` untuk audio azan Zohor, Asar, Maghrib, dan Isyak.
- `assets/audio/iqamat.mp3` untuk audio iqamat custom.
- `assets/video/*.mp4` atau `assets/video/*.webm` untuk slideshow video.

Selepas salin fail, buka `admin.html` dan masukkan path fail tersebut.
