import { greet, date } from "./date";
import { initClientNetworkInfo } from "./client-info";
import { bindThemeButtons, loadTheme } from "./themer";
import { initKeyboardSearch } from "./search"

document.addEventListener('DOMContentLoaded', async () => {

  loadTheme()
  date()
  greet()
  bindThemeButtons()
  initKeyboardSearch()
  initClientNetworkInfo()
  setInterval(date, 1000)
})
