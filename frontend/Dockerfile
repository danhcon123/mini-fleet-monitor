FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

EXPOSE 5173

# --host exposes the dev server to all interfaces (needed inside Docker)
CMD ["npx", "vite", "--host"]
