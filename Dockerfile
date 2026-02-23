# Stage 1: Build the React Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Setup Node.js Backend & Combine
FROM node:18-alpine
WORKDIR /app

# Install native dependencies required for SQLite
RUN apk add --no-cache python3 make g++ 

COPY backend/package*.json ./
RUN npm install --production

COPY backend/ .
# Copy the built React app into the backend's public folder
COPY --from=frontend-builder /app/frontend/dist ./public

# Create a directory for the persistent SQLite database & images
RUN mkdir -p /app/data
ENV DB_PATH=/app/data/grocery.db

EXPOSE 3000
CMD ["node", "server.js"]