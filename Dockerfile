FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
ENV NODE_ENV=development
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Create screenshots directory
RUN mkdir -p screenshots

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application with migrations after DB is ready
CMD sh -c "npx wait-on tcp:postgres:5432 && npx prisma migrate deploy && node dist/index.js"

