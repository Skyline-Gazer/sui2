// escape values from the external geoip API before injecting into innerHTML
const escapeHtml = (s) => s.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]))

let geo = null
let geoLoaded = false
// true once the header has been replaced by the time.is widget
let widgetReady = false

const WIDGET_SCRIPT = '//widget.time.is/en.js'

function loadGeoip() {
  geoLoaded = true
  window.getgeoip = (json) => {
    geo = json
    date()
    initTimeWidget()
  }
  // JSONP request to api.ip.sb; the response calls window.getgeoip(json)
  const s = document.createElement('script')
  s.src = 'https://api.ip.sb/geoip?callback=getgeoip'
  document.head.appendChild(s)
}

// "Asia/Hong_Kong" -> "Hong_Kong" (IANA city names match time.is city ids)
// returns null for non-city zones such as "Etc/GMT+5" or "UTC"
function cityFromTimezone(tz) {
  if (!tz || tz.indexOf('/') === -1) return null
  const parts = tz.split('/')
  const city = parts[parts.length - 1]
  if (!city || /[+\d]/.test(city) || /^(utc|gmt)$/i.test(city)) return null
  return city
}

function geoText() {
  return geo ? `; ${escapeHtml(geo.country_code)}, ${escapeHtml(geo.ip)}` : ''
}

// local-time fallback: also used until the geoip data arrives
function renderLocalTime() {
  if (widgetReady) return
  const el = document.getElementById('header_date')
  if (!el) return
  const now = new Date()
  const date = now.toLocaleDateString('en-GB', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})
  const time = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false})
  el.innerHTML =
    `<span class="date">${date}${geoText()}</span><span class="time">${time}</span>`
}

function initTimeWidget() {
  if (widgetReady || !geo) return
  const city = cityFromTimezone(geo.timezone)
  if (!city) return
  const container = document.getElementById('header_date')
  if (!container) return

  const id = `${city}_z001`
  container.innerHTML =
    `<a href="https://time.is/${encodeURIComponent(city)}" id="time_is_link" rel="nofollow">` +
    `Time in ${city.replace(/_/g, ' ')}:</a>` +
    `<span id="${id}" class="time-widget"></span>` +
    `<span class="geo">${geoText()}</span>`
  widgetReady = true

  const s = document.createElement('script')
  s.src = WIDGET_SCRIPT
  s.onload = () => {
    if (window.time_is_widget) {
      window.time_is_widget.init({
        [id]: {
          template: 'TIME DATE',
          time_format: 'hours:minutes',
          date_format: 'dayname, dnum monthname year',
        },
      })
    }
    // if the city is unknown to time.is the widget span stays empty;
    // fall back to the local-time rendering
    setTimeout(() => {
      const span = document.getElementById(id)
      if (span && !span.textContent.trim()) {
        widgetReady = false
        date()
      }
    }, 5000)
  }
  s.onerror = () => {
    widgetReady = false
    date()
  }
  document.head.appendChild(s)
}

export function date() {
  if (!geoLoaded) {
    loadGeoip()
  }
  renderLocalTime()
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
