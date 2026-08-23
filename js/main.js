import { greet, date } from "./date";
import { bindThemeButtons, loadTheme } from "./themer";
import { initKeyboardSearch } from "./search"

document.addEventListener('DOMContentLoaded', async () => {

  loadTheme()
  date()
  greet()
  bindThemeButtons()
  initKeyboardSearch()
  setInterval(date, 1000 * 60)
})
