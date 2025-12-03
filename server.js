import express from "express";
import cors from "cors";
import { spawn } from "child_process";

const app = express();
app.use(cors());

// Utility: run yt-dlp and stream output directly to the client
function streamYTDLP(url, args, res, contentType) {
    res.setHeader("Content-Type", contentType);

    const process = spawn("yt-dlp", [
        "--cookies", "./cookies.txt",
        "--extractor-args", "youtube:player_client=default",
        ...args,
        "-o", "-",               // send file to stdout
        url
    ]);

    process.stdout.pipe(res);   // stream file to user

    process.stderr.on("data", data => {
        console.log("yt-dlp:", data.toString());
    });

    process.on("close", code => {
        console.log("yt-dlp finished with code", code);
        // res.end();  <-- not needed, piping handles it
    });
}

// ------------------------------
//   MP3: /mp3?url=YOUTUBE_URL
// ------------------------------
app.get("/mp3", (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "Missing ?url=" });

    console.log("MP3 request:", url);

    streamYTDLP(
        url,
        ["-f", "bestaudio", "--extract-audio", "--audio-format", "mp3"],
        res,
        "audio/mpeg"
    );
});

// ------------------------------
//   MP4: /mp4?url=YOUTUBE_URL
// ------------------------------
app.get("/mp4", (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "Missing ?url=" });

    console.log("MP4 request:", url);

    streamYTDLP(
        url,
        ["-f", "bestvideo+bestaudio", "--merge-output-format", "mp4"],
        res,
        "video/mp4"
    );
});

// -------------------------------------------------------
//  Combined API: /download?url=...  returns meta only
//  (Use Zapier to choose mp3 or mp4 endpoints above)
// -------------------------------------------------------
app.get("/download", (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "Missing ?url=" });

    console.log("Metadata request:", url);

    const process = spawn("yt-dlp", [
        "--cookies", "./cookies.txt",
        "--extractor-args", "youtube:player_client=default",
        "--dump-json",
        url
    ]);

    let output = "";

    process.stdout.on("data", data => {
        output += data.toString();
    });

    process.stderr.on("data", data => {
        console.log("yt-dlp:", data.toString());
    });

    process.on("close", code => {
        try {
            const info = JSON.parse(output);
            return res.json({
                success: true,
                title: info.title,
                thumbnail: info.thumbnail,
                duration: info.duration,
                formats: {
                    mp3: `/mp3?url=${encodeURIComponent(url)}`,
                    mp4: `/mp4?url=${encodeURIComponent(url)}`
                }
            });
        } catch (err) {
            return res.status(500).json({
                error: "Failed parsing yt-dlp output",
                raw: output
            });
        }
    });
});

// -------------------------------------------------------
app.listen(3000, () => {
    console.log("YT Converter API running on port 3000");
});
