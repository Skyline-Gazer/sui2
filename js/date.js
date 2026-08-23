// escape values from the external geoip API before injecting into innerHTML
const escapeHtml = (s) => s.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]))

let geo = null
let geoLoaded = false

function loadGeoip() {
  geoLoaded = true
  window.getgeoip = (json) => {
    geo = json
    date()
  }
  // JSONP request to api.ip.sb; the response calls window.getgeoip(json)
  const s = document.createElement('script')
  s.src = 'https://api.ip.sb/geoip?callback=getgeoip'
  document.head.appendChild(s)
}

export function date() {
  if (!geoLoaded) {
    loadGeoip()
  }
  let currentDate = new Date();
  let dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  let date = currentDate.toLocaleDateString("en-GB", dateOptions);
  const time = currentDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
  const geoText = geo ? `${escapeHtml(geo.country_code)}, ${escapeHtml(geo.ip)}` : '';
  const tzText = geo ? escapeHtml(geo.timezone) : '';
  document.getElementById("header_date").innerHTML =
    `<span class="date">${date}${geoText ? ` <span class="geo">${geoText}</span>` : ''}</span>` +
    `<span class="time">${time}${tzText ? ` ${tzText}` : ''}</span>`;
}

export function greet() {
  let currentTime = new Date();
  let greet = Math.floor(currentTime.getHours() / 6);
  switch (greet) {
    case 0:
      document.getElementById("header_greet").innerHTML = "Good night :)";
      break;
    case 1:
      document.getElementById("header_greet").innerHTML = "Good morning :)";
      break;
    case 2:
      document.getElementById("header_greet").innerHTML = "Good afternoon :)";
      break;
    case 3:
      document.getElementById("header_greet").innerHTML = "Good evening :)";
      break;
  }
}
