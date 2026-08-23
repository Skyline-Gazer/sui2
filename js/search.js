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

  // remember which categories were initially collapsed, so a cleared
  // search can restore them
  document.querySelectorAll('.apps, .links_category').forEach(d => {
    if (!d.hasAttribute('open')) d.dataset.collapsed = 'true'
  })
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
        // search cleared (Escape / Backspace): restore the initial UI
        // state, including categories that were collapsed by default
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

// restore the search UI and collapse categories that were initially
// collapsed (their state is lost while searching)
function resetSearchState() {
  resetItems()
  document.querySelectorAll('details[data-collapsed="true"]').forEach(d => {
    d.removeAttribute('open')
  })
}

function handleMatchedItems(items) {
  document.activeElement.blur();
  resetItems()

  items.forEach((i, index) => {
    const item = i.item
    // expand the collapsed category (details) so the matched item is visible
    const details = item.el.closest('details')
    if (details) details.open = true
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
}
