const zones = [
  { state: "W.Persekutuan", code: "WLY01", name: "Putrajaya / Kuala Lumpur" },
  { state: "Selangor", code: "SGR01", name: "Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, Shah Alam" },
  { state: "Selangor", code: "SGR02", name: "Sabak Bernam, Kuala Selangor" },
  { state: "Selangor", code: "SGR03", name: "Klang, Kuala Langat" },
  { state: "Johor", code: "JHR02", name: "Johor Bahru, Kota Tinggi, Mersing" },
  { state: "Kedah", code: "KDH01", name: "Kota Setar, Kubang Pasu, Pokok Sena" },
  { state: "Kelantan", code: "KTN01", name: "Kota Bharu, Bachok, Pasir Puteh, Tumpat" },
  { state: "Melaka", code: "MLK01", name: "Melaka" },
  { state: "Pulau Pinang", code: "PNG01", name: "Pulau Pinang" },
  { state: "Perak", code: "PRK02", name: "Ipoh, Batu Gajah, Kampar, Sungai Siput" },
  { state: "Sabah", code: "SBH07", name: "Kota Kinabalu, Penampang, Putatan" },
  { state: "Sarawak", code: "SWK08", name: "Kuching, Bau, Lundu, Sematan" },
];

const prayerOrder = ["imsak", "fajr", "syuruk", "dhuhr", "asr", "maghrib", "isha"];
const azanPrayerOrder = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const prayerLabels = { imsak: "Imsak", fajr: "Subuh", syuruk: "Syuruk", dhuhr: "Zohor", asr: "Asar", maghrib: "Maghrib", isha: "Isyak" };
const settingsKey = "emasjid-display-settings";

const defaultSettings = {
  mosqueName: "Masjid Putrajaya",
  zone: "WLY01",
  prayerSource: "jakim",
  iqamahMinutes: 10,
  preAzanMinutes: 10,
  notice: "Sila senyapkan telefon anda • Selamat datang ke masjid • Lurus dan rapatkan saf",
  notices: ["Sila senyapkan telefon anda", "Selamat datang ke masjid", "Lurus dan rapatkan saf"],
  announcement: "17-6-2024 | Hari Raya Korban | 132 Hari Lagi",
  events: ["17-6-2024 | Hari Raya Korban | 132 Hari Lagi"],
  slideshowImages: [],
  mediaSlides: [],
  prayerBackground: "",
  slideSeconds: 12,
  azanAudio: "",
  iqamatAudio: "",
  prayerDurationMinutes: 10,
  manualTimes: { imsak: "06:16", fajr: "06:26", syuruk: "07:34", dhuhr: "13:35", asr: "16:55", maghrib: "19:30", isha: "20:42" },
};

let settings = loadSettings();
let todayTimes = {};
let lastAzanKey = "";
let iqamahTimer;
let slideIndex = 0;

const elements = {
  mosqueName: document.querySelector("#mosqueName"), zoneName: document.querySelector("#zoneName"), dayName: document.querySelector("#dayName"), clock: document.querySelector("#clock"),
  gregorianDate: document.querySelector("#gregorianDate"), hijriDate: document.querySelector("#hijriDate"), eventDate: document.querySelector("#eventDate"), eventTitle: document.querySelector("#eventTitle"), eventCountdown: document.querySelector("#eventCountdown"),
  nextPrayer: document.querySelector("#nextPrayer"), countdown: document.querySelector("#countdown"), countdownLabel: document.querySelector("#countdownLabel"), prayerGrid: document.querySelector("#prayerGrid"), noticeText: document.querySelector("#noticeText"),
  syncStatus: document.querySelector("#syncStatus"), mediaStage: document.querySelector("#mediaStage"), azanOverlay: document.querySelector("#azanOverlay"), azanPrayer: document.querySelector("#azanPrayer"), iqamahCountdown: document.querySelector("#iqamahCountdown"), prayerOverlay: document.querySelector("#prayerOverlay"), prayerOverlayName: document.querySelector("#prayerOverlayName"),
};

function loadSettings() {
  return { ...defaultSettings, ...JSON.parse(localStorage.getItem(settingsKey) || "{}") };
}

function saveSettings(nextSettings) {
  settings = { ...defaultSettings, ...nextSettings };
  localStorage.setItem(settingsKey, JSON.stringify(settings));
}

function applySettings() {
  const zone = zones.find((item) => item.code === settings.zone) || zones[0];
  elements.mosqueName.textContent = settings.mosqueName;
  elements.zoneName.textContent = zone.name.split(",")[0];
  elements.noticeText.textContent = (settings.notices?.length ? settings.notices : [settings.notice]).join(" • ");
  renderAnnouncement();
  if (settings.prayerBackground) document.querySelector(".display").style.setProperty("--prayer-bg", `url('${settings.prayerBackground}')`);
  applySlide();
}

function renderAnnouncement() {
  const eventLine = settings.events?.[0] || settings.announcement;
  const [date = "--", title = "Pengumuman", countdown = ""] = eventLine.split("|").map((part) => part.trim());
  elements.eventDate.textContent = date;
  elements.eventTitle.textContent = title;
  elements.eventCountdown.textContent = countdown;
}

function applySlide() {
  const slides = ((settings.mediaSlides?.length ? settings.mediaSlides : settings.slideshowImages) || []).filter(Boolean);
  if (!slides.length) {
    elements.mediaStage.innerHTML = "";
    return;
  }
  const active = slides[slideIndex % slides.length];
  elements.mediaStage.innerHTML = isVideo(active) ? `<video src="${active}" autoplay muted loop playsinline></video>` : `<img src="${active}" alt="">`;
  document.querySelector(".display").style.setProperty("--bg-image", `url('${active}')`);
}

function isVideo(path) {
  return /\.(mp4|webm|ogg)$/i.test(path);
}

function startSlideshow() {
  applySlide();
  setInterval(() => {
    slideIndex += 1;
    applySlide();
  }, Math.max(5, Number(settings.slideSeconds || 12)) * 1000);
}

function getApiUrl() {
  const params = new URLSearchParams({ r: "esolatApi/takwimsolat", period: "today", zone: settings.zone });
  return `https://www.e-solat.gov.my/index.php?${params}`;
}

async function loadPrayerTimes() {
  if (settings.prayerSource === "manual") {
    todayTimes = { ...settings.manualTimes };
    elements.hijriDate.textContent = "Manual";
    elements.syncStatus.textContent = "Menggunakan waktu solat manual daripada admin.";
    renderPrayerGrid();
    tick();
    return;
  }

  elements.syncStatus.textContent = "Menyambung data rasmi e-Solat JAKIM...";
  const response = await fetch(getApiUrl(), { cache: "no-store" });
  if (!response.ok) throw new Error("JAKIM API gagal dicapai");
  const data = await response.json();
  const item = data.prayerTime?.[0];
  if (!item) throw new Error("Data waktu solat kosong");

  todayTimes = Object.fromEntries(prayerOrder.map((key) => [key, normalizeTime(item[key]) || settings.manualTimes[key]]));
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
  const candidates = azanPrayerOrder.map((key) => ({ key, time: parseTime(todayTimes[key]) })).filter((item) => item.time > now);
  if (candidates.length) return candidates[0];
  const fajrTomorrow = parseTime(todayTimes.fajr || "00:00");
  fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
  return { key: "fajr", time: fajrTomorrow };
}

function renderPrayerGrid() {
  elements.prayerGrid.innerHTML = prayerOrder.map((key) => `<article class="prayer-card" data-prayer="${key}"><span>${prayerLabels[key]}</span><span>${todayTimes[key] || "--:--"}</span></article>`).join("");
}

function renderDate(now = new Date()) {
  elements.dayName.textContent = now.toLocaleDateString("ms-MY", { weekday: "long" });
  elements.clock.textContent = now.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  elements.gregorianDate.textContent = now.toLocaleDateString("ms-MY", { day: "2-digit", month: "short", year: "numeric" });
}

function tick() {
  const now = new Date();
  renderDate(now);
  if (!Object.keys(todayTimes).length) return;

  const upcoming = getUpcomingPrayer(now);
  const diff = Math.max(0, upcoming.time - now);
  const preAzanMs = Number(settings.preAzanMinutes || 0) * 60 * 1000;
  elements.countdownLabel.textContent = diff <= preAzanMs ? "Countdown Waktu Azan" : "Waktu Solat Seterusnya";
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
  const current = azanPrayerOrder.find((key) => todayTimes[key] === `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` && now.getSeconds() === 0);
  const azanKey = `${now.toDateString()}-${current}`;
  if (current && azanKey !== lastAzanKey) {
    lastAzanKey = azanKey;
    showAzan(current);
  }
}

function showAzan(key) {
  elements.azanPrayer.textContent = prayerLabels[key];
  elements.azanOverlay.hidden = false;
  playSound(settings.azanAudio);
  startIqamahCountdown(Number(settings.iqamahMinutes || 0) * 60, key);
}

function playSound(source) {
  if (source) {
    const audio = new Audio(source);
    audio.play();
    return;
  }
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

function startIqamahCountdown(seconds, prayerKey) {
  clearInterval(iqamahTimer);
  const endAt = Date.now() + seconds * 1000;
  iqamahTimer = setInterval(() => {
    const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
    elements.iqamahCountdown.textContent = `Iqamah dalam ${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
    if (remaining === 0) {
      clearInterval(iqamahTimer);
      elements.iqamahCountdown.textContent = "Sila bangun untuk iqamah";
      playSound(settings.iqamatAudio);
      setTimeout(() => {
        elements.azanOverlay.hidden = true;
        showPrayerMode(prayerKey);
      }, 10_000);
    }
  }, 1000);
}

function showPrayerMode(prayerKey) {
  elements.prayerOverlayName.textContent = prayerLabels[prayerKey];
  elements.prayerOverlay.hidden = false;
  setTimeout(() => { elements.prayerOverlay.hidden = true; }, Number(settings.prayerDurationMinutes || 10) * 60 * 1000);
}

function scheduleRefresh() {
  setInterval(loadPrayerTimes, 60 * 60 * 1000);
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 5 && now.getSeconds() === 0) loadPrayerTimes();
  }, 1000);
}

window.emasjidDefaults = { zones, defaultSettings, prayerOrder, prayerLabels, settingsKey };
applySettings();
startSlideshow();
setInterval(tick, 1000);
scheduleRefresh();
loadPrayerTimes().catch((error) => {
  todayTimes = { ...settings.manualTimes };
  elements.syncStatus.textContent = `${error.message}. Fallback kepada waktu manual.`;
  renderPrayerGrid();
});
tick();
