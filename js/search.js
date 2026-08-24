import Fuse from 'fuse.js'

const store = {
  keyword: '',
  searchItems: null,
  fuse: null,
}

function loadSearchItems() {
  const items = []
  // loop .apps_item
  document.querySelectorAll('.apps_item').forEach(el => {
    const nameEl = el.querySelector('.name')
    items.push({
      name: nameEl.textContent,
      el,
      nameEl,
    })
  })

  // loop .links_item
  document.querySelectorAll('.links_item').forEach(el => {
    const nameEl = el
    items.push({
      name: nameEl.textContent,
      el,
      nameEl,
    })
  })

  store.searchItems = items
  store.fuse = new Fuse(items, {
    keys: ['name'],
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 1,
    threshold: 0.2,
  })
}

// details that the search itself expanded, mapped to
// { wasOpen, userTouched }:
//  - wasOpen: whether the category was open before the search touched it
//  - userTouched: set when the user clicks the category header (summary)
//    during the search — the only reliable signal of manual intent,
//    because the browser may coalesce multiple open-state changes into a
//    single 'toggle' event, which cannot distinguish programmatic
//    changes from user clicks
// On clearing the search, only untouched categories that were initially
// closed and are still open are rolled back.
const searchOpened = new Map()
// every category the user clicked during the search session, even before
// the search first matched an item inside it — so a category the user
// already folded is never force-opened when it later becomes a match
const userClicked = new Set()

function onSummaryClick(d) {
  userClicked.add(d)
  const info = searchOpened.get(d)
  if (info) info.userTouched = true
}

const keywordEl = document.getElementById("keyword")
const regularCharsRe = /\w/

function updateKeyword(key) {
  // Backspace
  if (key === 'Backspace') {
    if (store.keyword.length > 0) {
      store.keyword = store.keyword.slice(0, store.keyword.length - 1)
    }
  } else if (key === 'Escape') {  // ESC
    store.keyword = ''
  } else {
    // e.key already gives the character; keep only single word chars
    if (key.length === 1 && regularCharsRe.test(key)) {
      store.keyword = store.keyword + key
    }
  }
  if (store.keyword) {
    keywordEl.innerHTML = `<span>${store.keyword}</span>`
  } else {
    keywordEl.innerHTML = ''
  }
  return store.keyword
}

function handleKeyPress(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) {
    // ignore key combination
    return
  }
  if (e.key === 'Tab' || e.key === 'Enter') { // Tab to switch and Enter to open
      // use default behavior
      return
  } else {
    const oldKeyword = store.keyword
    const keyword = updateKeyword(e.key)

    // only act when the keyword changes
    if (keyword !== oldKeyword) {
      if (keyword) {
        const items = store.fuse.search(keyword)
        handleMatchedItems(items)
      } else {
        // search cleared (Escape / Backspace): restore the UI state
        resetSearchState()
      }
    }
  }
}

const matchedClass = 'matched'

function resetItems() {
  store.searchItems.forEach(item => {
    item.el.setAttribute('tabindex', 0)
    item.nameEl.textContent = item.name
    item.el.classList.remove(matchedClass)
  })
}

// restore the search UI; roll back only the category expansions the
// search itself caused and the user never manually touched (and only
// those still open), so manual user toggles are always preserved
function resetSearchState() {
  resetItems()
  searchOpened.forEach((info, details) => {
    if (!info.userTouched && !info.wasOpen && details.open) details.open = false
  })
  searchOpened.clear()
  userClicked.clear()
}

function handleMatchedItems(items) {
  document.activeElement.blur();
  resetItems()

  items.forEach((i, index) => {
    const item = i.item
    // expand the collapsed category (details) so the matched item is visible,
    // but never force-open a category the user manually toggled during the
    // search — their latest choice wins (items there are still highlighted)
    const details = item.el.closest('details')
    if (details) {
      let info = searchOpened.get(details)
      if (!info) {
        // remember the state before the search first touched this category;
        // clicks made before the first match also count as user intent
        info = {wasOpen: details.open, userTouched: userClicked.has(details)}
        searchOpened.set(details, info)
      }
      if (!info.userTouched && !details.open) {
        details.open = true
      }
    }
    if (index === 0) {
      item.el.focus();
    }
    const tabindex = index + 1
    item.el.setAttribute('tabindex', tabindex)
    item.el.classList.add(matchedClass)

    // because we only have one key to match when initializing Fuse,
    // matches will only have 1 item
    highlightText(item.nameEl, i.matches[0])
  })
}

function highlightText(el, match) {
  // no match data: leave the text as-is instead of crashing
  if (!match || !match.indices || !match.indices.length) return
  // get the longest part
  match.indices.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))
  const pos = match.indices[0]
  const start = pos[0], end = pos[1] + 1
  const text = match.value
  // build highlight nodes with DOM APIs to avoid HTML injection
  el.textContent = ''
  el.append(
    document.createTextNode(text.slice(0, start)),
    Object.assign(document.createElement('em'), { textContent: text.slice(start, end) }),
    document.createTextNode(text.slice(end, text.length)),
  )
}

export function initKeyboardSearch() {
  loadSearchItems()
  document.addEventListener('keydown', handleKeyPress);
  // track manual open/close during a search: only the user's click on a
  // category header is a reliable signal (a single 'toggle' event may
  // coalesce several state changes and cannot tell them apart)
  document.querySelectorAll('.apps, .links_category').forEach(d => {
    d.addEventListener('click', (e) => {
      if (e.target.closest('summary')) onSummaryClick(d)
    })
  })
}
