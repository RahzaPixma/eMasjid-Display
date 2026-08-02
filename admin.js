const zones = [
  { state: "W.Persekutuan", code: "WLY01", name: "Putrajaya / Kuala Lumpur" }, { state: "Selangor", code: "SGR01", name: "Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, Shah Alam" },
  { state: "Selangor", code: "SGR02", name: "Sabak Bernam, Kuala Selangor" }, { state: "Selangor", code: "SGR03", name: "Klang, Kuala Langat" }, { state: "Johor", code: "JHR02", name: "Johor Bahru, Kota Tinggi, Mersing" },
  { state: "Kedah", code: "KDH01", name: "Kota Setar, Kubang Pasu, Pokok Sena" }, { state: "Kelantan", code: "KTN01", name: "Kota Bharu, Bachok, Pasir Puteh, Tumpat" }, { state: "Melaka", code: "MLK01", name: "Melaka" },
  { state: "Pulau Pinang", code: "PNG01", name: "Pulau Pinang" }, { state: "Perak", code: "PRK02", name: "Ipoh, Batu Gajah, Kampar, Sungai Siput" }, { state: "Sabah", code: "SBH07", name: "Kota Kinabalu, Penampang, Putatan" },
  { state: "Sarawak", code: "SWK08", name: "Kuching, Bau, Lundu, Sematan" },
];
const prayerOrder = ["imsak", "fajr", "syuruk", "dhuha", "dhuhr", "asr", "maghrib", "isha"];
const prayerLabels = { imsak: "Imsak", fajr: "Subuh", syuruk: "Syuruk", dhuha: "Dhuha", dhuhr: "Zohor", asr: "Asar", maghrib: "Maghrib", isha: "Isyak" };
const settingsKey = "emasjid-display-settings";
const defaults = {
  mosqueName: "Masjid Putrajaya", zone: "WLY01", prayerSource: "jakim", iqamahMinutes: 10, preAzanMinutes: 10,
  notice: "Sila senyapkan telefon anda • Selamat datang ke masjid • Lurus dan rapatkan saf", notices: ["Sila senyapkan telefon anda", "Selamat datang ke masjid", "Lurus dan rapatkan saf"], announcement: "25 Ogos 2026 | Maulidur Rasul", eventSource: "auto", eventAutoUrl: "https://www.e-solat.gov.my/index.php?siteId=24&pageId=26", events: ["25 Ogos 2026 | Maulidur Rasul"],
  slideshowImages: [], mediaSlides: [], prayerBackground: "", slideSeconds: 12, fajrAzanAudio: "", azanAudio: "", iqamatAudio: "", prayerDurationMinutes: 10, manualTimes: { imsak: "06:16", fajr: "06:26", syuruk: "07:34", dhuha: "08:02", dhuhr: "13:35", asr: "16:55", maghrib: "19:30", isha: "20:42" },
};
const form = document.querySelector("#adminForm");
const manualTimes = document.querySelector("#manualTimes");
const status = document.querySelector("#status");
const fields = Object.fromEntries(["mosqueName", "zone", "prayerSource", "eventSource", "eventAutoUrl", "mediaSlides", "slideSeconds", "prayerBackground", "fajrAzanAudio", "azanAudio", "iqamatAudio", "preAzanMinutes", "iqamahMinutes", "notices", "events", "prayerDurationMinutes"].map((id) => [id, document.querySelector(`#${id}`)]));

function readSettings() { return { ...defaults, ...JSON.parse(localStorage.getItem(settingsKey) || "{}") }; }
function writeSettings(settings) { localStorage.setItem(settingsKey, JSON.stringify(settings)); }
function setup() {
  fields.zone.innerHTML = zones.map((zone) => `<option value="${zone.code}">${zone.state} - ${zone.code} - ${zone.name}</option>`).join("");
  manualTimes.innerHTML = prayerOrder.map((key) => `<label>${prayerLabels[key]}<input id="manual-${key}" type="time" required></label>`).join("");
  fillForm(readSettings());
}
function fillForm(settings) {
  fields.mosqueName.value = settings.mosqueName; fields.zone.value = settings.zone; fields.prayerSource.value = settings.prayerSource; fields.eventSource.value = settings.eventSource; fields.eventAutoUrl.value = settings.eventAutoUrl; fields.slideSeconds.value = settings.slideSeconds;
  fields.prayerBackground.value = settings.prayerBackground; fields.fajrAzanAudio.value = settings.fajrAzanAudio; fields.azanAudio.value = settings.azanAudio; fields.iqamatAudio.value = settings.iqamatAudio; fields.preAzanMinutes.value = settings.preAzanMinutes; fields.iqamahMinutes.value = settings.iqamahMinutes; fields.prayerDurationMinutes.value = settings.prayerDurationMinutes;
  fields.notices.value = (settings.notices || [settings.notice]).join("\n");
  fields.events.value = (settings.events || [settings.announcement]).join("\n");
  fields.mediaSlides.value = (settings.mediaSlides || settings.slideshowImages || []).join("\n");
  prayerOrder.forEach((key) => { document.querySelector(`#manual-${key}`).value = settings.manualTimes[key]; });
}
function collectForm() {
  return {
    mosqueName: fields.mosqueName.value.trim(), zone: fields.zone.value, prayerSource: fields.prayerSource.value, eventSource: fields.eventSource.value, eventAutoUrl: fields.eventAutoUrl.value.trim(), slideSeconds: Number(fields.slideSeconds.value || 12), prayerBackground: fields.prayerBackground.value.trim(), fajrAzanAudio: fields.fajrAzanAudio.value.trim(), azanAudio: fields.azanAudio.value.trim(), iqamatAudio: fields.iqamatAudio.value.trim(),
    preAzanMinutes: Number(fields.preAzanMinutes.value || 0), iqamahMinutes: Number(fields.iqamahMinutes.value || 0), prayerDurationMinutes: Number(fields.prayerDurationMinutes.value || 10),
    notices: fields.notices.value.split("\n").map((line) => line.trim()).filter(Boolean), events: fields.events.value.split("\n").map((line) => line.trim()).filter(Boolean),
    mediaSlides: fields.mediaSlides.value.split("\n").map((line) => line.trim()).filter(Boolean), manualTimes: Object.fromEntries(prayerOrder.map((key) => [key, document.querySelector(`#manual-${key}`).value])),
  };
}
form.addEventListener("submit", (event) => { event.preventDefault(); writeSettings({ ...defaults, ...collectForm() }); status.textContent = "Tetapan disimpan. Refresh paparan utama untuk lihat perubahan."; });
document.querySelector("#resetButton").addEventListener("click", () => { writeSettings(defaults); fillForm(defaults); status.textContent = "Tetapan default dipulihkan."; });
setup();
