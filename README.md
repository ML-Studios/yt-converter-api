# YT Converter API (MP3 + MP4)

A simple Node.js + yt-dlp API for converting YouTube videos into MP3 and MP4 files.
Supports age-restricted videos using cookies.txt.

## Endpoint

GET /download?url=YOUTUBE_URL

Returns:
- mp3_path
- mp4_path
- thumbnail
- title
