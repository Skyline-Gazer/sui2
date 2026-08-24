const TRACE_ENDPOINT = "/cdn-cgi/trace";
const REQUEST_TIMEOUT_MS = 3000;

const IP_CHARACTERS = /^[0-9a-f:.]+$/i;
const REGION_CODE = /^[A-Z]{2}$/;

export function parseCloudflareTrace(text) {
  if (typeof text !== "string") return null;

  const fields = {};
  for (const line of text.split(/\r?\n/)) {
    const separator = line.indexOf("=");
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key && value) fields[key] = value;
  }

  const ip = fields.ip;
  const location = fields.loc?.toUpperCase();
  const validIp = ip && ip.length <= 45 && IP_CHARACTERS.test(ip) && /[.:]/.test(ip);

  if (!validIp || !REGION_CODE.test(location || "")) return null;
  return { ip, location };
}

function getRegionName(location) {
  try {
    const locale = document.documentElement.lang || navigator.language || "en";
    return new Intl.DisplayNames([locale], { type: "region" }).of(location) || location;
  } catch {
    return location;
  }
}

function getDisplayLocation(location) {
  return location === "GB" ? "UK" : location;
}

export async function initClientNetworkInfo() {
  const element = document.getElementById("client-network-info");
  if (!element) return;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(TRACE_ENDPOINT, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return;

    const info = parseCloudflareTrace(await response.text());
    if (!info) return;

    element.textContent = `IP ${info.ip} · ${getDisplayLocation(info.location)}`;
    element.setAttribute(
      "aria-label",
      `User IP: ${info.ip}; User location: ${getRegionName(info.location)}`,
    );
    element.hidden = false;
  } catch {
    // Non-Cloudflare deployments and network failures should leave this optional field hidden.
  } finally {
    window.clearTimeout(timeout);
  }
}
