# ===== Build stage =====
FROM node:20-slim AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./

# Vite baca env prefiks VITE_ saat build
ARG VITE_API_URL
ARG VITE_ENABLE_MOCK_DATA
ARG VITE_WS_RECONNECT_INTERVAL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ENABLE_MOCK_DATA=$VITE_ENABLE_MOCK_DATA
ENV VITE_WS_RECONNECT_INTERVAL=$VITE_WS_RECONNECT_INTERVAL

RUN npm run build   # output: /app/dist

# ===== Runtime (served by nginx, lihat nginx/Dockerfile) =====
# (Tidak ada CMD di stage ini; artefak dipakai Nginx)
