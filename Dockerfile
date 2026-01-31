# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose Port
EXPOSE 3000

# Start command 
CMD ["npm", "start"]

