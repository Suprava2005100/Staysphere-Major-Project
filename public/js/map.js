// Safety checks (very important)
if (typeof L === "undefined") {
  console.error("Leaflet not loaded ❌");
}

if (!window.listingData) {
  console.error("listingData not found ❌");
}

// Coordinates
const coords = window.listingData?.geometry?.coordinates;

console.log("Coords:", coords);

if (!coords || coords.length < 2) {
  console.log("No valid coordinates found ❌");
} else {

  // Custom red marker
  const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Create map
  const map = L.map('map', {
  zoomControl: false
}).setView([coords[1], coords[0]], 12);

L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);

  // Marker
  L.marker([coords[1], coords[0]], { icon: redIcon })
    .addTo(map)
    .bindPopup(`
  <div style="font-family: sans-serif;">
    <strong style="font-size:14px;">${window.listingData.title}</strong><br>
    <span style="color:gray;">📍 ${window.listingData.location}, ${window.listingData.country}</span><br>
    <span style="color:#2ecc71;">₹ ${window.listingData.price}</span>
  </div>
`)
}