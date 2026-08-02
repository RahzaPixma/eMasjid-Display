const zones = [
  { state: "W.Persekutuan", code: "WLY01", name: "Putrajaya / Kuala Lumpur" }, { state: "Selangor", code: "SGR01", name: "Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, Shah Alam" },
  { state: "Selangor", code: "SGR02", name: "Sabak Bernam, Kuala Selangor" }, { state: "Selangor", code: "SGR03", name: "Klang, Kuala Langat" }, { state: "Johor", code: "JHR02", name: "Johor Bahru, Kota Tinggi, Mersing" },
  { state: "Kedah", code: "KDH01", name: "Kota Setar, Kubang Pasu, Pokok Sena" }, { state: "Kelantan", code: "KTN01", name: "Kota Bharu, Bachok, Pasir Puteh, Tumpat" }, { state: "Melaka", code: "MLK01", name: "Melaka" },
  { state: "Pulau Pinang", code: "PNG01", name: "Pulau Pinang" }, { state: "Perak", code: "PRK02", name: "Ipoh, Batu Gajah, Kampar, Sungai Siput" }, { state: "Sabah", code: "SBH07", name: "Kota Kinabalu, Penampang, Putatan" },
  { state: "Sarawak", code: "SWK08", name: "Kuching, Bau, Lundu, Sematan" },
];
const prayerOrder = ["imsak", "fajr", "syuruk", "dhuhr", "asr", "maghrib", "isha"];
const prayerLabels = { imsak: "Imsak", fajr: "Subuh", syuruk: "Syuruk", dhuhr: "Zohor", asr: "Asar", maghrib: "Maghrib", isha: "Isyak" };
const settingsKey = "emasjid-display-settings";
const defaults = {
  mosqueName: "Masjid Putrajaya", zone: "WLY01", prayerSource: "jakim", iqamahMinutes: 10, preAzanMinutes: 10,
  notice: "Sila senyapkan telefon anda • Selamat datang ke masjid • Lurus dan rapatkan saf", announcement: "17-6-2024 | Hari Raya Korban | 132 Hari Lagi",
  slideshowImages: ["assets/images/background.jpg"], slideSeconds: 12, azanAudio: "", manualTimes: { imsak: "06:16", fajr: "06:26", syuruk: "07:34", dhuhr: "13:35", asr: "16:55", maghrib: "19:30", isha: "20:42" },
};
const form = document.querySelector("#adminForm");
const manualTimes = document.querySelector("#manualTimes");
const status = document.querySelector("#status");
const fields = Object.fromEntries(["mosqueName", "zone", "prayerSource", "slideshowImages", "slideSeconds", "azanAudio", "preAzanMinutes", "iqamahMinutes", "notice", "announcement"].map((id) => [id, document.querySelector(`#${id}`)]));

function readSettings() { return { ...defaults, ...JSON.parse(localStorage.getItem(settingsKey) || "{}") }; }
function writeSettings(settings) { localStorage.setItem(settingsKey, JSON.stringify(settings)); }
function setup() {
  fields.zone.innerHTML = zones.map((zone) => `<option value="${zone.code}">${zone.state} - ${zone.code} - ${zone.name}</option>`).join("");
  manualTimes.innerHTML = prayerOrder.map((key) => `<label>${prayerLabels[key]}<input id="manual-${key}" type="time" required></label>`).join("");
  fillForm(readSettings());
}
function fillForm(settings) {
  fields.mosqueName.value = settings.mosqueName; fields.zone.value = settings.zone; fields.prayerSource.value = settings.prayerSource; fields.slideSeconds.value = settings.slideSeconds;
  fields.azanAudio.value = settings.azanAudio; fields.preAzanMinutes.value = settings.preAzanMinutes; fields.iqamahMinutes.value = settings.iqamahMinutes; fields.notice.value = settings.notice; fields.announcement.value = settings.announcement;
  fields.slideshowImages.value = (settings.slideshowImages || []).join("\n");
  prayerOrder.forEach((key) => { document.querySelector(`#manual-${key}`).value = settings.manualTimes[key]; });
}
function collectForm() {
  return {
    mosqueName: fields.mosqueName.value.trim(), zone: fields.zone.value, prayerSource: fields.prayerSource.value, slideSeconds: Number(fields.slideSeconds.value || 12), azanAudio: fields.azanAudio.value.trim(),
    preAzanMinutes: Number(fields.preAzanMinutes.value || 0), iqamahMinutes: Number(fields.iqamahMinutes.value || 0), notice: fields.notice.value.trim(), announcement: fields.announcement.value.trim(),
    slideshowImages: fields.slideshowImages.value.split("\n").map((line) => line.trim()).filter(Boolean), manualTimes: Object.fromEntries(prayerOrder.map((key) => [key, document.querySelector(`#manual-${key}`).value])),
  };
}
form.addEventListener("submit", (event) => { event.preventDefault(); writeSettings({ ...defaults, ...collectForm() }); status.textContent = "Tetapan disimpan. Refresh paparan utama untuk lihat perubahan."; });
document.querySelector("#resetButton").addEventListener("click", () => { writeSettings(defaults); fillForm(defaults); status.textContent = "Tetapan default dipulihkan."; });
setup();
