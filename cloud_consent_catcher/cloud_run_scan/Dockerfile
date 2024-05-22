# Use the official Playwright image as the base image
FROM mcr.microsoft.com/playwright:v1.43.0-jammy

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json file
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application code
COPY . .

# Expose the port that Cloud Run assigns (environment variable)
EXPOSE $PORT

# Start the application using the command specified in the package.json (likely "npm start")
CMD ["node", "cloud_scan.js"]

# # Use the official Playwright image as the base image
# FROM mcr.microsoft.com/playwright:v1.42.1-jammy

# # Set the working directory inside the container
# WORKDIR /app

# # Create the directory where Playwright will download browsers
# # RUN mkdir -p /usr/lib/playwright

# # Prevent Playwright from automatically downloading browsers upon installation
# ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# # Copy the package.json and package-lock.json (if exists) files
# COPY package*.json ./

# # Install dependencies
# # Note: This step installs Playwright and its default browsers.
# # If you need a specific version of browsers, use npm to add them explicitly in the next steps.
# RUN npm install

# Install specific browsers
# Set the PLAYWRIGHT_BROWSERS_PATH environment variable to ensure browsers are downloaded to the intended directory.
# ENV PLAYWRIGHT_BROWSERS_PATH=/usr/lib/playwright


# Add specific versions of browsers. Adjust versions as needed.
# RUN PLAYWRIGHT_BROWSERS_PATH=/usr/lib/playwright npm install playwright-chromium@1.43.0
# RUN PLAYWRIGHT_BROWSERS_PATH=/usr/lib/playwright yarn add playwright-chromium@1.43.0
# RUN npm install playwright-webkit@1.43.0
# RUN npm install playwright-firefox@1.43.0

# RUN npx playwright install chromium


# RUN ls -la /app
# # Optionally, if you have tests to run, replace `yarn test` with the npm equivalent
# # RUN npm test

# # Copy the application code
# COPY . .

# # Expose the port that Cloud Run assigns (environment variable)
# EXPOSE $PORT

# # Start the application using the command specified in the package.json (likely "npm start")
# CMD ["node", "cloud_scan.js"]

# # Start from the latest official Node.js image
# FROM node:latest

# # Set the working directory inside the container
# WORKDIR /app

# # Update the system and install system dependencies required for Playwright's browsers
# RUN apt-get update && apt-get install -y \
#     wget \
#     fonts-liberation \
#     libasound2 \
#     libatk-bridge2.0-0 \
#     libatk1.0-0 \
#     libcups2 \
#     libdbus-1-3 \
#     libdrm2 \
#     libgbm1 \
#     libglib2.0-0 \
#     libnspr4 \
#     libnss3 \
#     libx11-6 \
#     libx11-xcb1 \
#     libxcb1 \
#     libxdamage1 \
#     libxrandr2 \
#     ca-certificates \
#     fonts-liberation \
#     libappindicator3-1 \
#     libasound2 \
#     libatk-bridge2.0-0 \
#     libatk1.0-0 \
#     libatspi2.0-0 \
#     libcups2 \
#     libdbus-1-3 \
#     libgdk-pixbuf2.0-0 \
#     libnspr4 \
#     libnss3 \
#     libxcomposite1 \
#     libxdamage1 \
#     libxrandr2 \
#     xdg-utils \
#     --no-install-recommends \
#     && apt-get clean \
#     && rm -rf /var/lib/apt/lists/*

# # Copy the package.json and package-lock.json files
# COPY package*.json ./

# # Install dependencies, including the latest version of Playwright
# RUN npm install

# # Install the Playwright browsers
# RUN npx playwright install

# # Copy the application code
# COPY . .

# # Expose the port that Cloud Run assigns (environment variable)
# EXPOSE $PORT

# # Start the application using the command specified in the package.json (likely "npm start")
# CMD ["node", "cloud_scan.js"]
