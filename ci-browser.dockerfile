FROM node:24-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    tar \
    gzip \
    unzip \
    git \
    chromium \
    procps \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /opt/java \
    && curl -fsSL https://download.oracle.com/java/25/latest/jdk-25_linux-aarch64_bin.tar.gz \
      | tar -xz -C /opt/java \
    && mv /opt/java/jdk-25* /opt/java/jdk-25

ENV JAVA_HOME=/opt/java/jdk-25
ENV PATH="${JAVA_HOME}/bin:${PATH}"

ENV CHROME_PATH=/usr/bin/chromium
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright

WORKDIR /tmp/pw-install

COPY app/package.json app/package-lock.json ./

RUN npm ci

RUN node --version \
    && npm --version \
    && git --version \
    && unzip -v | head -n 2 \
    && chromium --version \
    && java -version \
    && javac -version
