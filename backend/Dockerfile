# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Dependencies
RUN npm ci

# Copy tsconfig + source before build
COPY tsconfig*.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Copy source code
COPY . .

# Expose Port
EXPOSE 3000

# Start command 
CMD ["npm", "start"]

