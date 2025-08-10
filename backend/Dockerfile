FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY backend/package*.json ./
RUN npm install

# Copy the rest of the application
COPY backend/ ./

# List files for debugging
RUN ls -la

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]