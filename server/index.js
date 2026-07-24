const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { spawn, execFile } = require("child_process");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──

app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : "*",
    methods: ["GET", "POST"],
  })
);

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: { status: "error", error: "Too many requests. Please wait a moment." },
});
app.use(limiter);

// ── Fallback Cobalt Endpoints ──
const COBALT_ENDPOINTS = [
  "https://api.cobalt.tools/api/json",
  "https://co.wuk.sh/api/json",
  "https://cobalt.api.scotty.rip/api/json",
  "https://co.eepy.today/api/json",
];

// ── Helpers ──

/**
 * Clean mangled or double-pasted URLs
 */
function cleanUrlInput(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  let trimmed = rawUrl.trim();

  // Handle double paste e.g. "https://youtu.be/123https://youtu.be/123"
  const httpMatches = trimmed.match(/https?:\/\/[^\s]+/g);
  if (httpMatches && httpMatches.length > 0) {
    let first = httpMatches[0];
    // If first match contains another embedded "http", split it
    const secondHttpIdx = first.indexOf("http", 8);
    if (secondHttpIdx > 0) {
      first = first.substring(0, secondHttpIdx);
    }
    return first;
  }
  return trimmed;
}

/**
 * Run yt-dlp with given args and return parsed JSON stdout.
 */
function runYtDlp(args, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const proc = execFile("yt-dlp", args, {
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large format lists
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    }, (error, stdout, stderr) => {
      if (error) {
        // Extract useful error message from stderr
        const msg = stderr?.split("\n").filter(l => l.startsWith("ERROR:")).join(" ") || error.message;
        return reject(new Error(msg));
      }
      resolve(stdout);
    });
  });
}

/**
 * Format seconds into MM:SS or HH:MM:SS
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Detect platform name from URL
 */
function detectPlatform(url) {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube";
  if (u.includes("instagram.com")) return "Instagram";
  if (u.includes("tiktok.com")) return "TikTok";
  if (u.includes("twitter.com") || u.includes("x.com")) return "Twitter / X";
  if (u.includes("facebook.com") || u.includes("fb.watch")) return "Facebook";
  if (u.includes("vimeo.com")) return "Vimeo";
  if (u.includes("reddit.com") || u.includes("redd.it")) return "Reddit";
  if (u.includes("soundcloud.com")) return "SoundCloud";
  if (u.includes("twitch.tv")) return "Twitch";
  if (u.includes("dailymotion.com") || u.includes("dai.ly")) return "Dailymotion";
  if (u.includes("bilibili.com")) return "Bilibili";
  if (u.includes("pinterest.com") || u.includes("pin.it")) return "Pinterest";
  return "Media";
}

/**
 * Fallback to Cobalt API when yt-dlp encounters bot protection
 */
async function fallbackCobaltInfo(url) {
  const platform = detectPlatform(url);
  for (const endpoint of COBALT_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          downloadMode: "auto",
          vQuality: "1080",
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;
      const data = await res.json();

      const mediaUrl = data.url || (data.picker && data.picker[0]?.url);
      if (!mediaUrl) continue;

      // Extract YouTube ID if possible for thumbnail & title enrichment
      let title = `${platform} Video`;
      let thumbnail = null;
      const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([\w-]{11})/);
      if (ytMatch) {
        thumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
        try {
          const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytMatch[1]}&format=json`);
          if (oembedRes.ok) {
            const oembed = await oembedRes.json();
            if (oembed.title) title = oembed.title;
          }
        } catch {}
      }

      return {
        status: "success",
        platform,
        title,
        thumbnail,
        duration: null,
        durationSeconds: null,
        uploader: null,
        uploaderUrl: null,
        viewCount: null,
        uploadDate: null,
        formats: [
          {
            id: "cobalt-video",
            label: "Best Quality (Video + Audio)",
            qualityLabel: "Best",
            type: "video",
            ext: "mp4",
            directUrl: mediaUrl,
            isBest: true,
          },
          {
            id: "cobalt-audio",
            label: "Best Audio (MP3)",
            qualityLabel: "Best",
            type: "audio",
            ext: "mp3",
            directUrl: mediaUrl,
            isBest: true,
            needsConversion: true,
          },
        ],
        originalUrl: url,
      };
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Build a clean format list from yt-dlp JSON output.
 * Deduplicates and sorts by quality.
 */
function buildFormatList(info) {
  const formats = [];
  const seen = new Set();

  if (info.formats && Array.isArray(info.formats)) {
    for (const f of info.formats) {
      if (!f.url && !f.manifest_url) continue;
      if (f.ext === "mhtml" || f.protocol === "mhtml") continue;

      const hasVideo = f.vcodec && f.vcodec !== "none";
      const hasAudio = f.acodec && f.acodec !== "none";

      if (hasVideo && hasAudio) {
        const height = f.height || 0;
        const label = `${height}p`;
        const key = `video-${height}`;
        if (seen.has(key)) continue;
        seen.add(key);

        formats.push({
          id: f.format_id,
          label: `Video ${label}`,
          qualityLabel: label,
          type: "video",
          ext: f.ext || "mp4",
          height: height,
          filesize: f.filesize || f.filesize_approx || null,
          filesizeLabel: formatBytes(f.filesize || f.filesize_approx),
          vcodec: f.vcodec,
          acodec: f.acodec,
        });
      } else if (hasAudio && !hasVideo) {
        const abr = f.abr || f.tbr || 0;
        const key = `audio-${Math.round(abr)}`;
        if (seen.has(key) || abr === 0) continue;
        seen.add(key);

        formats.push({
          id: f.format_id,
          label: `Audio ${Math.round(abr)}kbps`,
          qualityLabel: `${Math.round(abr)}kbps`,
          type: "audio",
          ext: f.ext || "m4a",
          abr: Math.round(abr),
          filesize: f.filesize || f.filesize_approx || null,
          filesizeLabel: formatBytes(f.filesize || f.filesize_approx),
          acodec: f.acodec,
        });
      }
    }
  }

  const videoFormats = formats
    .filter((f) => f.type === "video")
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  const audioFormats = formats
    .filter((f) => f.type === "audio")
    .sort((a, b) => (b.abr || 0) - (a.abr || 0));

  const result = [];

  result.push({
    id: "bv*+ba/b",
    label: "Best Quality (Video + Audio)",
    qualityLabel: "Best",
    type: "video",
    ext: "mp4",
    height: videoFormats[0]?.height || null,
    filesize: null,
    filesizeLabel: null,
    isBest: true,
  });

  result.push({
    id: "ba",
    label: "Best Audio (MP3)",
    qualityLabel: "Best",
    type: "audio",
    ext: "mp3",
    abr: audioFormats[0]?.abr || null,
    filesize: null,
    filesizeLabel: null,
    isBest: true,
    needsConversion: true,
  });

  for (const vf of videoFormats.slice(0, 5)) {
    result.push(vf);
  }
  for (const af of audioFormats.slice(0, 3)) {
    result.push(af);
  }

  return result;
}

// ── Routes ──

/**
 * POST /api/info
 * Extract video metadata + available formats
 */
app.post("/api/info", async (req, res) => {
  const rawUrl = req.body.url;
  const url = cleanUrlInput(rawUrl);

  if (!url || typeof url !== "string") {
    return res.status(400).json({ status: "error", error: "Missing or invalid URL" });
  }

  try {
    // Passes extractor args to bypass YouTube bot / sign-in check
    const stdout = await runYtDlp([
      "--dump-json",
      "--no-download",
      "--no-warnings",
      "--no-playlist",
      "--flat-playlist",
      "--extractor-args", "youtube:player_client=mweb,android,web",
      url,
    ]);

    const info = JSON.parse(stdout);
    const formats = buildFormatList(info);
    const platform = detectPlatform(info.webpage_url || url);

    res.json({
      status: "success",
      platform,
      title: info.title || info.fulltitle || "Untitled",
      thumbnail: info.thumbnail || null,
      duration: formatDuration(info.duration),
      durationSeconds: info.duration || null,
      uploader: info.uploader || info.channel || null,
      uploaderUrl: info.uploader_url || info.channel_url || null,
      viewCount: info.view_count || null,
      uploadDate: info.upload_date || null,
      formats,
      originalUrl: info.webpage_url || url,
    });
  } catch (err) {
    console.warn("[/api/info] yt-dlp error:", err.message, "— attempting Cobalt fallback...");

    // Try Cobalt fallback for bot-detected URLs or extractor errors
    const fallback = await fallbackCobaltInfo(url);
    if (fallback) {
      return res.json(fallback);
    }

    res.status(422).json({
      status: "error",
      error: err.message.includes("Sign in to confirm") || err.message.includes("bot")
        ? "YouTube is requesting bot verification for this video. Please try again in a few moments or try another link."
        : err.message.includes("ERROR:")
        ? err.message.replace(/ERROR:\s*/g, "")
        : "Failed to extract video information. The URL may be invalid, private, or unsupported.",
    });
  }
});

/**
 * GET /api/download
 * Stream the video/audio file to the client
 */
app.get("/api/download", async (req, res) => {
  const { url: rawUrl, format, filename, directUrl } = req.query;
  const url = cleanUrlInput(rawUrl);

  if (!url && !directUrl) {
    return res.status(400).json({ status: "error", error: "Missing url parameter" });
  }

  // If a direct media URL was provided by Cobalt fallback
  if (directUrl) {
    try {
      const upstream = await fetch(directUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        },
      });
      if (upstream.ok) {
        const contentType = upstream.headers.get("Content-Type") || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename || "download.mp4")}"`);
        const arrayBuffer = await upstream.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));
      }
    } catch (e) {
      console.error("Direct fallback download failed:", e);
    }
  }

  const formatId = format || "bv*+ba/b";
  const outputFilename = filename || "download.mp4";
  const isAudioConversion = formatId === "ba" || formatId === "bestaudio" || formatId === "cobalt-audio";

  try {
    const args = [
      "-f", formatId === "cobalt-video" || formatId === "cobalt-audio" ? "b/bv*+ba" : formatId,
      "--no-playlist",
      "--no-warnings",
      "--extractor-args", "youtube:player_client=mweb,android,web",
      "-o", "-",
    ];

    if (isAudioConversion) {
      args.splice(args.indexOf("-o"), 2);
      args.push("--extract-audio");
      args.push("--audio-format", "mp3");
      args.push("--audio-quality", "0");
      args.push("-o", "-");
    }

    args.push(url);

    const contentType = isAudioConversion ? "audio/mpeg" : "video/mp4";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(outputFilename)}"`);
    res.setHeader("Cache-Control", "no-cache");

    const proc = spawn("yt-dlp", args, {
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });

    proc.stdout.pipe(res);

    proc.stderr.on("data", (data) => {
      const msg = data.toString();
      if (msg.includes("ERROR:")) {
        console.error("[/api/download] yt-dlp stderr:", msg);
      }
    });

    proc.on("error", (err) => {
      console.error("[/api/download] Spawn error:", err);
      if (!res.headersSent) {
        res.status(500).json({ status: "error", error: "Failed to start download process" });
      }
    });

    proc.on("close", (code) => {
      if (code !== 0 && !res.headersSent) {
        res.status(500).json({ status: "error", error: `yt-dlp exited with code ${code}` });
      }
    });

    req.on("close", () => {
      if (!proc.killed) {
        proc.kill("SIGTERM");
      }
    });
  } catch (err) {
    console.error("[/api/download] Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ status: "error", error: "Download failed" });
    }
  }
});

/**
 * GET /health
 */
app.get("/health", async (req, res) => {
  try {
    const stdout = await runYtDlp(["--version"], 5000);
    res.json({
      status: "ok",
      ytdlp: stdout.trim(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: "error",
      error: "yt-dlp is not available",
      details: err.message,
    });
  }
});

// ── Start ──

app.listen(PORT, () => {
  console.log(`🎬 yt-dlp API server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});
