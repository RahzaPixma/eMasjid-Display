const zones = [
  { code: "WLY01", name: "Putrajaya / Kuala Lumpur" },
  { code: "SGR01", name: "Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, Shah Alam" },
  { code: "SGR02", name: "Sabak Bernam, Kuala Selangor" },
  { code: "SGR03", name: "Klang, Kuala Langat" },
  { code: "JHR02", name: "Johor Bahru, Kota Tinggi, Mersing" },
  { code: "KDH01", name: "Kota Setar, Kubang Pasu, Pokok Sena" },
  { code: "KTN01", name: "Kota Bharu, Bachok, Pasir Puteh, Tumpat" },
  { code: "MLK01", name: "Melaka" },
  { code: "PNG01", name: "Pulau Pinang" },
  { code: "PRK02", name: "Ipoh, Batu Gajah, Kampar, Sungai Siput" },
  { code: "SBH07", name: "Kota Kinabalu, Penampang, Putatan" },
  { code: "SWK08", name: "Kuching, Bau, Lundu, Sematan" },
];

const prayerOrder = ["imsak", "fajr", "syuruk", "dhuhr", "asr", "maghrib", "isha"];
const prayerLabels = { imsak: "Imsak", fajr: "Subuh", syuruk: "Syuruk", dhuhr: "Zohor", asr: "Asar", maghrib: "Maghrib", isha: "Isyak" };
const jakimFields = { imsak: "imsak", fajr: "fajr", syuruk: "syuruk", dhuhr: "dhuhr", asr: "asr", maghrib: "maghrib", isha: "isha" };
const settingsKey = "emasjid-display-settings";

let settings = loadSettings();
let todayTimes = {};
let lastAzanKey = "";
let iqamahTimer;

const elements = {
  zoneName: document.querySelector("#zoneName"),
  zoneSelect: document.querySelector("#zoneSelect"),
  dayName: document.querySelector("#dayName"),
  clock: document.querySelector("#clock"),
  gregorianDate: document.querySelector("#gregorianDate"),
  hijriDate: document.querySelector("#hijriDate"),
  eventDate: document.querySelector("#eventDate"),
  eventTitle: document.querySelector("#eventTitle"),
  eventCountdown: document.querySelector("#eventCountdown"),
  nextPrayer: document.querySelector("#nextPrayer"),
  countdown: document.querySelector("#countdown"),
  prayerGrid: document.querySelector("#prayerGrid"),
  noticeText: document.querySelector("#noticeText"),
  noticeInput: document.querySelector("#noticeInput"),
  announcementInput: document.querySelector("#announcementInput"),
  iqamahMinutes: document.querySelector("#iqamahMinutes"),
  saveSettings: document.querySelector("#saveSettings"),
  syncStatus: document.querySelector("#syncStatus"),
  azanOverlay: document.querySelector("#azanOverlay"),
  azanPrayer: document.querySelector("#azanPrayer"),
  iqamahCountdown: document.querySelector("#iqamahCountdown"),
};

function loadSettings() {
  const fallback = {
    zone: "WLY01",
    iqamahMinutes: 10,
    notice: "Sila senyapkan telefon anda • Selamat datang ke masjid • Lurus dan rapatkan saf",
    announcement: "17-6-2024 | Hari Raya Korban | 132 Hari Lagi",
  };
  return { ...fallback, ...JSON.parse(localStorage.getItem(settingsKey) || "{}") };
}

function saveSettings() {
  settings = {
    zone: elements.zoneSelect.value,
    iqamahMinutes: Number(elements.iqamahMinutes.value || 0),
    notice: elements.noticeInput.value.trim(),
    announcement: elements.announcementInput.value.trim(),
  };
  localStorage.setItem(settingsKey, JSON.stringify(settings));
  applySettings();
  fetchPrayerTimes();
}

function applySettings() {
  const zone = zones.find((item) => item.code === settings.zone) || zones[0];
  elements.zoneName.textContent = zone.name.split(",")[0];
  elements.noticeText.textContent = settings.notice;
  elements.noticeInput.value = settings.notice;
  elements.announcementInput.value = settings.announcement;
  elements.iqamahMinutes.value = settings.iqamahMinutes;
  elements.zoneSelect.value = zone.code;
  renderAnnouncement();
}

function setupZones() {
  elements.zoneSelect.innerHTML = zones.map((zone) => `<option value="${zone.code}">${zone.code} - ${zone.name}</option>`).join("");
}

function formatClock(date) {
  return date.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
}

function formatDate(date) {
  return date.toLocaleDateString("ms-MY", { day: "2-digit", month: "short", year: "numeric" });
}

function renderDate(now = new Date()) {
  elements.dayName.textContent = now.toLocaleDateString("ms-MY", { weekday: "long" });
  elements.clock.textContent = formatClock(now);
  elements.gregorianDate.textContent = formatDate(now);
}

function renderAnnouncement() {
  const [date = "--", title = "Pengumuman", countdown = ""] = settings.announcement.split("|").map((part) => part.trim());
  elements.eventDate.textContent = date;
  elements.eventTitle.textContent = title;
  elements.eventCountdown.textContent = countdown;
}

function getApiUrl() {
  const params = new URLSearchParams({ r: "esolatApi/takwimsolat", period: "today", zone: settings.zone });
  return `https://www.e-solat.gov.my/index.php?${params}`;
}

async function fetchPrayerTimes() {
  elements.syncStatus.textContent = "Menyambung data rasmi JAKIM...";
  const response = await fetch(getApiUrl(), { cache: "no-store" });
  if (!response.ok) throw new Error("JAKIM API gagal dicapai");

  const data = await response.json();
  const item = data.prayerTime?.[0];
  if (!item) throw new Error("Data waktu solat kosong");

  todayTimes = Object.fromEntries(prayerOrder.map((key) => [key, normalizeTime(item[jakimFields[key]])]));
  elements.hijriDate.textContent = item.hijri || data.hijri || "Tarikh Hijrah tidak tersedia";
  elements.syncStatus.textContent = `Dikemas kini daripada JAKIM: ${new Date().toLocaleTimeString("ms-MY")}`;
  renderPrayerGrid();
  tick();
}

function normalizeTime(value = "") {
  return value.replace(/\s*(am|pm)$/i, "").padStart(5, "0");
}

function parseTime(time) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function getUpcomingPrayer(now = new Date()) {
  const candidates = prayerOrder
    .filter((key) => key !== "imsak" && key !== "syuruk")
    .map((key) => ({ key, time: parseTime(todayTimes[key]) }))
    .filter((item) => item.time > now);

  if (candidates.length) return candidates[0];
  const fajrTomorrow = parseTime(todayTimes.fajr || "00:00");
  fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
  return { key: "fajr", time: fajrTomorrow };
}

function renderPrayerGrid() {
  elements.prayerGrid.innerHTML = prayerOrder.map((key) => `
    <article class="prayer-card" data-prayer="${key}">
      <span>${prayerLabels[key]}</span>
      <span>${todayTimes[key] || "--:--"}</span>
    </article>
  `).join("");
}

function tick() {
  const now = new Date();
  renderDate(now);
  if (!Object.keys(todayTimes).length) return;

  const upcoming = getUpcomingPrayer(now);
  const diff = Math.max(0, upcoming.time - now);
  elements.nextPrayer.textContent = prayerLabels[upcoming.key];
  elements.countdown.textContent = formatDuration(diff);
  document.querySelectorAll(".prayer-card").forEach((card) => card.classList.toggle("active", card.dataset.prayer === upcoming.key));
  maybeTriggerAzan(now);
}

function formatDuration(ms) {
  const hours = String(Math.floor(ms / 3_600_000)).padStart(2, "0");
  const minutes = String(Math.floor((ms % 3_600_000) / 60_000)).padStart(2, "0");
  const seconds = String(Math.floor((ms % 60_000) / 1000)).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function maybeTriggerAzan(now) {
  const current = prayerOrder
    .filter((key) => !["imsak", "syuruk"].includes(key))
    .find((key) => todayTimes[key] === `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` && now.getSeconds() === 0);

  const azanKey = `${formatDate(now)}-${current}`;
  if (current && azanKey !== lastAzanKey) {
    lastAzanKey = azanKey;
    showAzan(current);
  }
}

function showAzan(key) {
  elements.azanPrayer.textContent = prayerLabels[key];
  elements.azanOverlay.hidden = false;
  playAzanTone();
  startIqamahCountdown(settings.iqamahMinutes * 60);
}

function playAzanTone() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 440;
  oscillator.connect(gain);
  gain.connect(context.destination);
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.25, context.currentTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 2.5);
  oscillator.start();
  oscillator.stop(context.currentTime + 2.5);
}

function startIqamahCountdown(seconds) {
  clearInterval(iqamahTimer);
  const endAt = Date.now() + seconds * 1000;
  iqamahTimer = setInterval(() => {
    const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
    elements.iqamahCountdown.textContent = `Iqamah dalam ${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
    if (remaining === 0) {
      clearInterval(iqamahTimer);
      elements.iqamahCountdown.textContent = "Sila bangun untuk iqamah";
      setTimeout(() => { elements.azanOverlay.hidden = true; }, 60_000);
    }
  }, 1000);
}

function scheduleDailyRefresh() {
  setInterval(fetchPrayerTimes, 60 * 60 * 1000);
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 5 && now.getSeconds() === 0) fetchPrayerTimes();
  }, 1000);
}

elements.saveSettings.addEventListener("click", saveSettings);
setupZones();
applySettings();
setInterval(tick, 1000);
scheduleDailyRefresh();
fetchPrayerTimes().catch((error) => {
  elements.syncStatus.textContent = `${error.message}. Semak internet atau cuba zon lain.`;
});
tick();
