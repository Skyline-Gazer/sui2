import { defineConfig } from 'vite'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import handlebars from 'vite-plugin-handlebars'
import { VitePWA } from 'vite-plugin-pwa'
import { getIconSVG } from './src/icons'

// envs
const DATA_FILE = process.env.DATA_FILE,
  OUT_DIR = process.env.OUT_DIR,
  WEBMANIFEST_NAME = process.env.WEBMANIFEST_NAME,
  WEBMANIFEST_DESCRIPTION = process.env.WEBMANIFEST_DESCRIPTION,
  WEBMANIFEST_SHORT_NAME = process.env.WEBMANIFEST_SHORT_NAME,
  WEBMANIFEST_SCOPE = process.env.WEBMANIFEST_SCOPE,
  NO_PWA = process.env.NO_PWA;

let dataFile = DATA_FILE || './data.json'
console.log('use DATA_FILE: ', dataFile)

var data
try {
  data = JSON.parse(readFileSync(dataFile))
} catch (e) {
  if (e.code === 'ENOENT' && !DATA_FILE) {
    console.log('data.json missing, fall back to data.example.json')
    data = await import('./src/data.example.json')
  } else {
    throw e;
  }
}

const absoluteHttpUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return undefined

  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined
  } catch {
    return undefined
  }
}

const structuredData = (site) => {
  const title = typeof site.title === 'string' ? site.title : 'SUI2'
  const description = typeof site.description === 'string' ? site.description : undefined
  const siteUrl = absoluteHttpUrl(site.siteUrl)
  const websiteId = siteUrl ? `${siteUrl}#website` : undefined

  const website = {
    '@type': 'WebSite',
    name: title,
    ...(description ? { description } : {}),
    ...(siteUrl ? { url: siteUrl, '@id': websiteId } : {}),
  }

  const page = {
    '@type': 'CollectionPage',
    name: title,
    ...(description ? { description } : {}),
    ...(siteUrl ? { url: siteUrl, '@id': `${siteUrl}#webpage` } : {}),
    ...(websiteId ? { isPartOf: { '@id': websiteId } } : {}),
  }

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [website, page],
  }).replace(/</g, '\\u003c')
}

const manifest = {
  "name": WEBMANIFEST_NAME || "SUI2",
  "short_name": WEBMANIFEST_SHORT_NAME || "sui2",
  "description": WEBMANIFEST_DESCRIPTION || "a startpage for your server and / or new tab page",
  "icons": [
    {
      "src": "icon-512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "scope": "/",
  "start_url": "/",
  "display": "standalone"
}

if (WEBMANIFEST_SCOPE) {
  manifest.scope = WEBMANIFEST_SCOPE
  manifest.start_url = WEBMANIFEST_SCOPE
}

export default defineConfig({
  // frontend source is under src/ (html entries, scss, js, public)
  root: "src",
  // use relative path for assets
  base: "",
  build: {
    // put assets in the same folder as index.html
    assetsDir: ".",
    // outDir is resolved relative to root (src/), so back up to the repo dist/
    outDir: OUT_DIR || "../dist",
    // outDir lives outside root (src/); make sure a rebuild empties stale files
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'src/index.html'),
        page404: resolve(import.meta.dirname, 'src/404.html'),
      },
    },
  },
  plugins: [
    NO_PWA ? null
    : VitePWA({
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      // https://developer.chrome.com/docs/workbox/modules/workbox-build/#generatesw-mode
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // https://developer.chrome.com/docs/workbox/reference/workbox-build/#property-GeneratePartial-navigateFallback
        navigateFallback: '404.html',
      },
      manifest,
    }),
    handlebars({
      context: data,
      helpers: {
        iconify: (name) => {
          const svg = getIconSVG(name)
          if (!svg) return `no icon ${name.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]))}`
          return svg
        },
        domain: (url) => {
          try {
            var o = new URL(url);
            if (o.port) {
              return `${o.hostname}:${o.port}`
            }
            return o.hostname
          } catch (e) {
            // invalid URL in data file should not break the build
            return url
          }
        },
        structuredData: () => structuredData(data),
      }
    }),
  ].filter(x => x !== null),
})
