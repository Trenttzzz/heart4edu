# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy source code
COPY frontend/ ./

# Build arguments for Vite
ARG VITE_API_URL
ARG VITE_ENABLE_MOCK_DATA
ARG VITE_WS_RECONNECT_INTERVAL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ENABLE_MOCK_DATA=$VITE_ENABLE_MOCK_DATA
ENV VITE_WS_RECONNECT_INTERVAL=$VITE_WS_RECONNECT_INTERVAL

# Expose port
EXPOSE 5173

# Serve static files with SPA fallback
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]