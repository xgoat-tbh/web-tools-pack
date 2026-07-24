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

// ── Helpers ──

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
 * Build a clean format list from yt-dlp JSON output.
 * Deduplicates and sorts by quality.
 */
function buildFormatList(info) {
  const formats = [];
  const seen = new Set();

  // yt-dlp "formats" array contains individual streams
  if (info.formats && Array.isArray(info.formats)) {
    for (const f of info.formats) {
      // Skip format-only entries without URLs
      if (!f.url && !f.manifest_url) continue;
      // Skip storyboard/mhtml formats
      if (f.ext === "mhtml" || f.protocol === "mhtml") continue;

      const hasVideo = f.vcodec && f.vcodec !== "none";
      const hasAudio = f.acodec && f.acodec !== "none";

      // We want combined (video+audio) formats and audio-only formats
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

  // Sort: videos by height descending, audio by bitrate descending
  const videoFormats = formats
    .filter((f) => f.type === "video")
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  const audioFormats = formats
    .filter((f) => f.type === "audio")
    .sort((a, b) => (b.abr || 0) - (a.abr || 0));

  // Always add "Best Video" and "Best Audio" convenience options at the top
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

  // Add specific quality options (skip duplicates of best)
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
  const { url } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ status: "error", error: "Missing or invalid URL" });
  }

  try {
    const stdout = await runYtDlp([
      "--dump-json",
      "--no-download",
      "--no-warnings",
      "--no-playlist",
      "--flat-playlist",
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
    console.error("[/api/info] Error:", err.message);
    res.status(422).json({
      status: "error",
      error: err.message.includes("ERROR:")
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
  const { url, format, filename } = req.query;

  if (!url) {
    return res.status(400).json({ status: "error", error: "Missing url parameter" });
  }

  const formatId = format || "bv*+ba/b";
  const outputFilename = filename || "download.mp4";
  const isAudioConversion = formatId === "ba" || formatId === "bestaudio";

  try {
    // Build yt-dlp args
    const args = [
      "-f", formatId,
      "--no-playlist",
      "--no-warnings",
      "-o", "-", // Output to stdout
    ];

    // If audio conversion to MP3, use yt-dlp's built-in postprocessor
    if (isAudioConversion) {
      // For audio, we pipe yt-dlp → ffmpeg → response
      args.splice(args.indexOf("-o"), 2); // Remove -o -
      args.push("--extract-audio");
      args.push("--audio-format", "mp3");
      args.push("--audio-quality", "0"); // Best quality
      args.push("-o", "-");
    }

    args.push(url);

    // Set response headers
    const contentType = isAudioConversion ? "audio/mpeg" : "video/mp4";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(outputFilename)}"`);
    res.setHeader("Cache-Control", "no-cache");

    // Spawn yt-dlp and pipe to response
    const proc = spawn("yt-dlp", args, {
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });

    proc.stdout.pipe(res);

    proc.stderr.on("data", (data) => {
      const msg = data.toString();
      // Only log actual errors, not progress
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

    // If client disconnects, kill the process
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
 * Health check endpoint
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
