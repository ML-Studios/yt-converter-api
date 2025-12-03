import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname in ES modules:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COOKIE_PATH = path.join(__dirname, "cookies.txt");

const app = express();
app.use(cors());

// Helper: run yt-dlp and capture ALL output
function runYTDLP(url, callback) {
    const args = [
        "--cookies", COOKIE_PATH,
        "--extractor-args", "youtube:player_client=default",
        "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "--dump-json",
        "--no-warnings",
        "--no-check-certificate",
        url
    ];

    console.log("RUNNING:", args);

    const process = spawn("yt-dlp", args);

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", data => {
        stdout += data.toString();
    });

    process.stderr.on("data", data => {
        stderr += data.toString();
    });

    process.on("close", code => {
        callback({ code, stdout, stderr });
    });
}

// Debug route
app.get("/download", (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "Missing ?url=" });

    runYTDLP(url, ({ code, stdout, stderr }) => {
        return res.status(500).json({
            debug: true,
            exitCode: code,
            stdout: stdout || "(empty)",
            stderr: stderr || "(empty)"
        });
    });
});

app.listen(3000, () => {
    console.log("YT Converter API DEBUG running on port 3000");
});
