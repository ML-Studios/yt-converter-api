FROM python:3.11-slim

# Install dependencies
RUN apt update && apt install -y ffmpeg curl nodejs npm && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN pip install yt-dlp

# App directory
WORKDIR /app

# Install Node deps
COPY package*.json ./
RUN npm install

# Copy app files
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
