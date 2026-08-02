const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const prayerLabels = {
  Fajr: "Subuh",
  Dhuhr: "Zohor",
  Asr: "Asar",
  Maghrib: "Maghrib",
  Isha: "Isyak",
};

let prayerTimes = {};

const clock = document.querySelector("#clock");
const date = document.querySelector("#date");
const nextPrayer = document.querySelector("#nextPrayer");
const countdown = document.querySelector("#countdown");
const prayerGrid = document.querySelector("#prayerGrid");
const status = document.querySelector("#status");
const form = document.querySelector("#locationForm");
const geoButton = document.querySelector("#geoButton");

function formatTime(value) {
  return value.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function updateClock() {
  const now = new Date();
  clock.textContent = formatTime(now);
  date.textContent = now.toLocaleDateString("ms-MY", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  updateNextPrayer(now);
}

function parsePrayerTime(name, time) {
  const [hour, minute] = time.split(" ")[0].split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  if (name === "Fajr" && date < new Date()) date.setDate(date.getDate() + 1);
  return date;
}

function updateNextPrayer(now = new Date()) {
  if (!Object.keys(prayerTimes).length) return;

  const upcoming = prayers
    .map((name) => ({ name, time: parsePrayerTime(name, prayerTimes[name]) }))
    .filter((item) => item.time > now)
    .sort((a, b) => a.time - b.time)[0] || { name: "Fajr", time: parsePrayerTime("Fajr", prayerTimes.Fajr) };

  const diff = Math.max(0, upcoming.time - now);
  const hours = String(Math.floor(diff / 3_600_000)).padStart(2, "0");
  const minutes = String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, "0");
  const seconds = String(Math.floor((diff % 60_000) / 1000)).padStart(2, "0");

  nextPrayer.textContent = prayerLabels[upcoming.name];
  countdown.textContent = `${hours}:${minutes}:${seconds}`;
  document.querySelectorAll(".prayer-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.prayer === upcoming.name);
  });
}

function renderPrayerTimes() {
  prayerGrid.innerHTML = prayers.map((name) => `
    <article class="prayer-card" data-prayer="${name}">
      <span>${prayerLabels[name]}</span>
      <span>${prayerTimes[name] || "--:--"}</span>
    </article>
  `).join("");
  updateNextPrayer();
}

async function fetchByCity(city, country) {
  status.textContent = "Memuatkan waktu solat...";
  const params = new URLSearchParams({ city, country, method: "3" });
  const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?${params}`);
  const result = await response.json();
  prayerTimes = result.data.timings;
  status.textContent = `Waktu solat dipaparkan untuk ${city}, ${country}.`;
  renderPrayerTimes();
}

async function fetchByCoordinates(latitude, longitude) {
  status.textContent = "Memuatkan waktu solat berdasarkan lokasi semasa...";
  const params = new URLSearchParams({ latitude, longitude, method: "3" });
  const response = await fetch(`https://api.aladhan.com/v1/timings?${params}`);
  const result = await response.json();
  prayerTimes = result.data.timings;
  status.textContent = "Waktu solat dipaparkan berdasarkan lokasi semasa anda.";
  renderPrayerTimes();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  fetchByCity(form.city.value.trim(), form.country.value.trim()).catch(() => {
    status.textContent = "Maaf, waktu solat tidak dapat dimuatkan. Cuba semula.";
  });
});

geoButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    status.textContent = "Pelayar ini tidak menyokong geolokasi.";
    return;
  }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => fetchByCoordinates(coords.latitude, coords.longitude),
    () => { status.textContent = "Lokasi tidak dibenarkan. Sila masukkan bandar secara manual."; },
  );
});

setInterval(updateClock, 1000);
updateClock();
fetchByCity("Kuala Lumpur", "Malaysia").catch(() => {
  status.textContent = "Maaf, waktu solat tidak dapat dimuatkan. Cuba semula.";
});
