import express from "express";
import cors from "cors";
import { exec } from "child_process";
import fs from "fs";

const app = express();
app.use(cors());

// API: GET /download?url=YOUTUBE_URL
app.get("/download", async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "Missing ?url=" });

    console.log("Downloading:", url);

    // yt-dlp command to generate BOTH mp3 + mp4
    const cmd = `
        yt-dlp --cookies ./cookies.txt \
        --extract-audio --audio-format mp3 --audio-quality 0 \
        --merge-output-format mp4 \
        --output "%(title)s.%(ext)s" \
        --print-json \
        ${url}
    `;

    exec(cmd, { cwd: "/tmp" }, (err, stdout, stderr) => {
        if (err) {
            return res.status(500).json({
                error: "yt-dlp failed",
                details: stderr
            });
        }

        let info;
        try {
            info = JSON.parse(stdout);
        } catch (e) {
            return res.status(500).json({
                error: "Failed to parse yt-dlp output",
                raw: stdout
            });
        }

        const title = info.title;
        const mp4File = `/tmp/${title}.mp4`;
        const mp3File = `/tmp/${title}.mp3`;

        return res.json({
            success: true,
            title,
            thumbnail: info.thumbnail,
            duration: info.duration,
            mp4_path: mp4File,
            mp3_path: mp3File
        });
    });
});

app.listen(3000, () => {
    console.log("YT Converter API running on port 3000");
});
