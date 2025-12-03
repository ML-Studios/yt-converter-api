import express from "express";
import cors from "cors";
import { spawn } from "child_process";

const app = express();
app.use(cors());

// --------------------------------------------------------
// Helper: run yt-dlp and capture EVERYTHING for debugging
// --------------------------------------------------------
function runYTDLPForDebug(url, callback) {
    const args = [
        "--cookies", "./cookies.txt",
        "--extractor-args", "youtube:player_client=default",
        "--dump-json",
        "--no-warning",
        "--no-check-certificate",
        url
    ];

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

// --------------------------------------------------------
// /download — returns ALL yt-dlp debug output
// --------------------------------------------------------
app.get("/download", async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "Missing ?url=" });

    console.log("DEBUG /download request:", url);

    runYTDLPForDebug(url, ({ code, stdout, stderr }) => {
        // 🚨 RETURN EVERYTHING so we know EXACTLY what is failing
        return res.status(500).json({
            debug: true,
            exitCode: code,
            raw_stdout: stdout || "(empty)",
            raw_stderr: stderr || "(empty)"
        });
    });
});

// --------------------------------------------------------
// NOTE: mp3/mp4 routes disabled temporarily until debugging
// --------------------------------------------------------

// --------------------------------------------------------
app.listen(3000, () => {
    console.log("YT Converter API (DEBUG MODE) running on port 3000");
});
