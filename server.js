import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" })); // allow Base64 cookies

// --------------------------------------------------------
// Helper: write cookies from Zapier to temp file
// --------------------------------------------------------
function writeTempCookies(base64) {
    const cookieFile = path.join("/tmp", `cookies-${Date.now()}.txt`);

    const decoded = Buffer.from(base64, "base64").toString("utf8");
    fs.writeFileSync(cookieFile, decoded);

    return cookieFile;
}

// --------------------------------------------------------
// Helper: run yt-dlp with dynamic cookies
// --------------------------------------------------------
function streamYTDLP(url, cookiePath, isMp3, res) {
    const args = [
        "--cookies", cookiePath,
        "--extractor-args", "youtube:player_client=default",
        "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "-o", "-",
    ];

    if (isMp3) {
        args.push("-f", "bestaudio", "--extract-audio", "--audio-format", "mp3");
        res.setHeader("Content-Type", "audio/mpeg");
    } else {
        args.push("-f", "bestvideo+bestaudio", "--merge-output-format", "mp4");
        res.setHeader("Content-Type", "video/mp4");
    }

    const process = spawn("yt-dlp", args.concat(url));

    process.stdout.pipe(res);

    process.stderr.on("data", data => {
        console.log("yt-dlp:", data.toString());
    });

    process.on("close", () => {
        console.log("yt-dlp finished");
    });
}

// --------------------------------------------------------
// /mp3 - download as MP3
// --------------------------------------------------------
app.post("/mp3", (req, res) => {
    const { url, cookies } = req.body;

    if (!url || !cookies) {
        return res.status(400).json({ error: "Missing url or cookies (Base64)" });
    }

    const cookiePath = writeTempCookies(cookies);
    streamYTDLP(url, cookiePath, true, res);
});

// --------------------------------------------------------
// /mp4 - download as MP4
// --------------------------------------------------------
app.post("/mp4", (req, res) => {
    const { url, cookies } = req.body;

    if (!url || !cookies) {
        return res.status(400).json({ error: "Missing url or cookies (Base64)" });
    }

    const cookiePath = writeTempCookies(cookies);
    streamYTDLP(url, cookiePath, false, res);
});

// --------------------------------------------------------
app.listen(3000, () => {
    console.log("YT Converter API (Dynamic Cookies) running on port 3000");
});
