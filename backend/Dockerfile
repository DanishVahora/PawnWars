# Stage 1: Build
FROM node:20 AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application files
COPY . .

# Stage 2: Runtime
FROM node:20-slim
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app ./

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]