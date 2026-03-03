import{PEXELS_VIDEO_OVERRIDES} from "../data/pexelsOverrides";
const PROXY_ENDPOINT = "/api/pexels";
const MEMORY_CACHE = new Map();
const CACHE_PREFIX = "ff-pexels-video:";
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const MAX_ERROR_SNIPPET = 160;

function getCache(key) {
  if (MEMORY_CACHE.has(key)) return MEMORY_CACHE.get(key);
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.ts) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    MEMORY_CACHE.set(key, parsed.data || null);
    return parsed.data || null;
  } catch (e) {
    return null;
  }
}

function setCache(key, data) {
  MEMORY_CACHE.set(key, data);
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data }));
  } catch (e) {}
}

function pickBestVideoFile(files = []) {
  const mp4 = files.filter((f) => f.file_type === "video/mp4");
  if (!mp4.length) return null;
  const sorted = mp4.slice().sort((a, b) => (a.width || 0) - (b.width || 0));
  const target = sorted.find((f) => (f.width || 0) >= 720 && (f.width || 0) <= 1280);
  return target || sorted[sorted.length - 1];
}

const STOP_TOKENS = new Set(["and", "with", "without", "the", "a", "an", "of", "to"]);
const VARIANT_TOKENS = [
  "knee",
  "knees",
  "assisted",
  "modified",
  "beginner",
  "easy",
  "incline",
  "decline",
  "diamond",
  "close",
  "closegrip",
  "wide",
  "bench",
  "wall",
  "chair",
  "band",
  "machine",
  "dumbbell",
  "barbell",
  "kettlebell",
  "smith",
  "cable",
  "bodyweight",
];

function normalizeToken(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function tokenize(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((t) => normalizeToken(t))
    .filter((t) => t && !STOP_TOKENS.has(t));
}

function urlTokens(videoUrl = "") {
  const parts = String(videoUrl).split("/");
  const slug = parts[parts.length - 1] || "";
  return tokenize(slug.replace(/\d+/g, ""));
}

function scoreVideo(video, { slug, name, query } = {}) {
  const baseTokens = tokenize(slug || name || "");
  const queryTokens = tokenize(query || "");
  const videoTokens = new Set(urlTokens(video?.url || ""));

  const allowed = new Set(baseTokens);
  const disallowed = VARIANT_TOKENS.filter((t) => !allowed.has(t));

  let score = 0;
  baseTokens.forEach((t) => {
    if (videoTokens.has(t)) score += 2;
  });
  queryTokens.forEach((t) => {
    if (videoTokens.has(t)) score += 1;
  });
  disallowed.forEach((t) => {
    if (videoTokens.has(t)) score -= 3;
  });

  return score;
}

function pickBestVideo(videos = [], meta) {
  if (!videos.length) return null;
  let best = videos[0];
  let bestScore = scoreVideo(best, meta);
  for (let i = 1; i < videos.length; i += 1) {
    const score = scoreVideo(videos[i], meta);
    if (score > bestScore) {
      best = videos[i];
      bestScore = score;
    }
  }
  return best;
}

async function runFetch(url, signal) {
  return fetch(url, { signal });
}

function clipSnippet(text = "") {
  const cleaned = String(text).replace(/\s+/g, " ").trim();
  return cleaned.slice(0, MAX_ERROR_SNIPPET);
}

async function readJsonResponse(res, label) {
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  const isJson = contentType.includes("application/json");

  if (!isJson) {
    const looksHtml = /<!doctype|<html/i.test(text);
    const snippet = clipSnippet(text);
    const hint = looksHtml
      ? " Likely an HTML page (proxy not active or wrong endpoint)."
      : "";
    const tail = snippet ? ` Response: ${snippet}` : "";
    throw new Error(`${label} returned non-JSON (${res.status}).${hint}${tail}`);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`${label} returned invalid JSON (${res.status}).`);
  }
}

async function fetchJson(url, signal, label) {
  const res = await runFetch(url, signal);
  const data = await readJsonResponse(res, label);
  if (!res.ok) {
    const msg = data?.error || data?.message || `${label} error: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function fetchPexelsVideo(query, options = {}) {
  const {
    orientation = "landscape",
    size = "medium",
    perPage = 8,
    minDuration = 5,
    maxDuration = 60,
    signal,
    meta,
  } = options;

  const cacheKey = `${query}|${orientation}|${size}|${perPage}|${minDuration}|${maxDuration}|${meta?.slug || ""}`;
  const cached = getCache(cacheKey);
  if (cached !== null) return cached;

  const base = window?.location?.origin || "http://localhost";
  const makeUrl = (endpoint, params = {}) => {
    const u = new URL(endpoint, base);
    Object.entries(params).forEach(([key, value]) => {
      if (value == null) return;
      u.searchParams.set(key, String(value));
    });
    return u.toString();
  };

  const data = await fetchJson(
    makeUrl(PROXY_ENDPOINT, {
      query,
      per_page: perPage,
      orientation,
      size,
      min_duration: minDuration,
      max_duration: maxDuration,
    }),
    signal,
    "Pexels proxy"
  );

  const video = pickBestVideo(data?.videos || [], {
    slug: meta?.slug,
    name: meta?.name,
    query,
  });
  if (!video) {
    setCache(cacheKey, null);
    return null;
  }

  const file = pickBestVideoFile(video.video_files || []);
  if (!file) {
    setCache(cacheKey, null);
    return null;
  }

  const result = {
    id: video.id,
    videoUrl: file.link,
    image: video.image || "",
    duration: video.duration,
    width: file.width,
    height: file.height,
    photographer: video.user?.name || "Pexels Creator",
    photographerUrl: video.user?.url || "https://www.pexels.com",
    pexelsUrl: video.url || "https://www.pexels.com/videos/",
  };

  setCache(cacheKey, result);
  return result;
}

export async function fetchPexelsVideoWithFallback(queries = [], options = {}) {
  let lastError = null;
  let lastQuery = null;
  const slug = options?.meta?.slug;
  const overrideId = slug ? PEXELS_VIDEO_OVERRIDES[slug] : null;
  if (overrideId) {
    try {
      const result = await fetchPexelsVideoById(overrideId, options);
      if (result) return { result, query: `id:${overrideId}`, error: null };
    } catch (e) {
      lastError = e;
    }
  }
  for (const q of queries) {
    if (!q) continue;
    try {
      lastQuery = q;
      const result = await fetchPexelsVideo(q, options);
      if (result) return { result, query: q, error: null };
    } catch (e) {
      lastError = e;
      if (options?.signal?.aborted) throw e;
    }
  }
  return { result: null, query: lastQuery, error: lastError };
}

export async function fetchPexelsVideoById(id, options = {}) {
  const { signal } = options;
  const base = window?.location?.origin || "http://localhost";
  const u = new URL(PROXY_ENDPOINT, base);
  u.searchParams.set("id", String(id));
  const data = await fetchJson(u.toString(), signal, "Pexels proxy");
  const video = data || null;
  if (!video?.video_files) return null;
  const file = pickBestVideoFile(video.video_files || []);
  if (!file) return null;
  return {
    id: video.id,
    videoUrl: file.link,
    image: video.image || "",
    duration: video.duration,
    width: file.width,
    height: file.height,
    photographer: video.user?.name || "Pexels Creator",
    photographerUrl: video.user?.url || "https://www.pexels.com",
    pexelsUrl: video.url || "https://www.pexels.com/videos/",
  };
}
