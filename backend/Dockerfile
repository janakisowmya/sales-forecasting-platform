# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript (skip in dev - using ts-node)
# RUN npm run build

# Add node_modules binaries to PATH
ENV PATH=/app/node_modules/.bin:$PATH

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript for production
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]
