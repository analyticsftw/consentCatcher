# Use the official Playwright image
FROM mcr.microsoft.com/playwright:v1.43.0-jammy

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

EXPOSE $PORT

# Command to run the application. Replace <YOUR_URL> with the URL you want to test or pass it dynamically
CMD ["node", "index.js"]