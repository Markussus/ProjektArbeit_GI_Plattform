FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y \
    chromium \
    procps \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_PATH=/usr/bin/chromium
