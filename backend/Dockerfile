# Use lightweight Node.js base image
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy dependency files first (better caching)
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy application source code
COPY . .

# ---------------------------
# Final runtime image
# ---------------------------
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy only needed files from build stage
COPY --from=build /app /app

# Set environment variables
ENV NODE_ENV=production \
    PORT=3001

# Expose only the required port
EXPOSE 3001

# Define healthcheck (adjust endpoint if your app exposes /health)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the app
CMD ["npm", "start"]

