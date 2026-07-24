FROM node:20-slim

# Install Python, ffmpeg, and yt-dlp
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip ffmpeg curl && \
    pip3 install --break-system-packages yt-dlp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Verify installations
RUN yt-dlp --version && ffmpeg -version | head -1

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy application code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the server
CMD ["node", "index.js"]
