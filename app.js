// ----- Radar météo -----
const map = L.map("radar").setView([46.6, 2.5], 5);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
  maxZoom: 12
}).addTo(map);

const label = document.getElementById("radar-time");
const slider = document.getElementById("radar-slider");
const playBtn = document.getElementById("radar-play");
const locBtn = document.getElementById("radar-loc");

let host = "";
let frames = [];
let radarLayer = null;
let current = 0;
let timer = null;

function frameUrl(frame) {
  // On utilise le "path" fourni par l'API tel quel
  return `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
}

function showFrame(i) {
  current = i;
  const frame = frames[i];
  const url = frameUrl(frame);

  if (!radarLayer) {
    radarLayer = L.tileLayer(url, {
      opacity: 0.7,
      maxNativeZoom: 7,
      maxZoom: 12
    }).addTo(map);
  } else {
    radarLayer.setUrl(url);
  }

  slider.value = i;
  const heure = new Date(frame.time * 1000).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  });
  label.textContent = heure + (i === frames.length - 1 ? " (dernière image)" : "");
}

async function loadRadar() {
  try {
    const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
    const data = await res.json();
    host = data.host;
    frames = data.radar.past;
    slider.max = frames.length - 1;
    showFrame(frames.length - 1);
  } catch (err) {
    label.textContent = "Radar indisponible";
    console.error(err);
  }
}

function togglePlay() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    playBtn.textContent = "▶ Lecture";
    return;
  }
  playBtn.textContent = "⏸ Pause";
  timer = setInterval(() => showFrame((current + 1) % frames.length), 1500);
}

slider.addEventListener("input", () => showFrame(Number(slider.value)));
playBtn.addEventListener("click", togglePlay);

locBtn.addEventListener("click", () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    pos => map.setView([pos.coords.latitude, pos.coords.longitude], 7),
    () => alert("Position non disponible")
  );
});

loadRadar();
setInterval(loadRadar, 5 * 60 * 1000); // actualisation toutes les 5 minutes