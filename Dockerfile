# ---------- Stage 1: builder (build the live-server editor frontend) ----------
FROM node:26-alpine AS builder
WORKDIR /live-server
ADD live-server/package.json ./
RUN npm i --no-audit --no-fund
ADD live-server ./
RUN npm run build && npm cache clean --force

# ---------- Stage 2: runtime ----------
FROM node:26-alpine

# tini for proper signal handling (alpine provides it as a tiny apk package,
# avoids downloading a binary from GitHub releases)
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

# main project dependencies.
# NOTE: devDependencies are intentionally kept in the runtime image because
# app.js rebuilds the startpage on first boot (and on the live editor's
# "Build" action) via `npm run build`, which requires vite & co.
WORKDIR /app
ADD package.json ./
RUN npm i --no-audit --no-fund && npm cache clean --force

# live-server runtime deps only (express)
WORKDIR /app/live-server
ADD live-server/package.json ./
RUN npm i --omit=dev --no-audit --no-fund && npm cache clean --force

# add all source files (node_modules / dist / .git are excluded via .dockerignore)
ADD . /app

# prebuilt editor frontend from the builder stage
COPY --from=builder /live-server/editor/dist /app/live-server/editor/dist

ENV DATA_DIR=/data
CMD ["node", "app.js"]
