FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y \
    chromium \
    procps \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_PATH=/usr/bin/chromium
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright

WORKDIR /tmp/pw-install

COPY app/package.json app/package-lock.json ./

RUN npm ci
RUN npx playwright install chromium
