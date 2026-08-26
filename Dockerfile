# Multi-stage build for the Meta Deduplication Monitor.
# glibc base (bookworm-slim) on purpose: better-sqlite3 ships prebuilt glibc
# binaries; musl (alpine) would force a source compile in the final image.

# --- build stage: full toolchain, dev deps, TypeScript build ---
FROM node:20-bookworm-slim AS build
# Toolchain only as fallback for better-sqlite3 when no prebuild matches.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# --- deps stage: production node_modules only ---
FROM node:20-bookworm-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# --- runtime stage: bare debian + the node binary, non-root, prod artifacts only ---
# npm/yarn/corepack and headers are left behind on purpose: the runtime only
# needs the node binary (95MB — the floor for any glibc Node image) plus
# libstdc++ for better-sqlite3.
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libstdc++6 \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd -g 1000 node && useradd -u 1000 -g node -m node
COPY --from=build /usr/local/bin/node /usr/local/bin/node
ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PORT=8080
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY scripts ./scripts
COPY package.json ./
RUN mkdir -p /data && chown node:node /data /app
USER node
VOLUME /data
EXPOSE 8080
CMD ["node", "dist/index.js"]
