# # Step 1: Build the Node.js app
# # Use an official Node.js runtime as the base image
# FROM node:14 AS build

# # Set the working directory in the container
# WORKDIR /usr/src/app

# # Copy package.json and package-lock.json to the working directory
# COPY package*.json ./

# # Install the application dependencies
# RUN npm install

# # Copy the app files to the working directory
# COPY . .

# # Step 2: Setup Playwright
# # Use the official Playwright image
# # FROM mcr.microsoft.com/playwright:focal
# FROM mcr.microsoft.com/playwright:v1.39.0-jammy



# # Set the working directory in the container
# WORKDIR /usr/src/app

# # Copy the built app files and installed modules from the build stage
# COPY --from=build /usr/src/app .

# # Define the command to run the app
# CMD [ "node", ".js" ]


# Use the official Playwright-ready image from Microsoft
FROM mcr.microsoft.com/playwright:focal
# FROM mcr.microsoft.com/playwright:bionic


# Create app directory
# WORKDIR /usr/src/app
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install
# RUN npx playwright install chromium
# RUN npx playwright install-deps chromium



# Copy the local script files to the container
COPY . .

# Expose the port the app will run on
# EXPOSE 8080
# RUN npx playwright install
# Command to run the script
CMD [ "node", "scan_ondemand.js" ]


# FROM ubuntu:focal

# ARG DEBIAN_FRONTEND=noninteractive
# ARG TZ=America/Los_Angeles
# ARG DOCKER_IMAGE_NAME_TEMPLATE="mcr.microsoft.com/playwright:v%version%-focal"

# # === INSTALL Node.js ===

# RUN apt-get update && \
#     # Install Node.js
#     apt-get install -y curl wget gpg ca-certificates && \
#     mkdir -p /etc/apt/keyrings && \
#     curl -sL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
#     echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" >> /etc/apt/sources.list.d/nodesource.list && \
#     apt-get update && \
#     apt-get install -y nodejs && \
#     # Feature-parity with node.js base images.
#     apt-get install -y --no-install-recommends git openssh-client && \
#     npm install -g yarn && \
#     # clean apt cache
#     rm -rf /var/lib/apt/lists/* && \
#     # Create the pwuser
#     adduser pwuser

# # === BAKE BROWSERS INTO IMAGE ===

# ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# # 1. Add tip-of-tree Playwright package to install its browsers.
# #    The package should be built beforehand from tip-of-tree Playwright.
# COPY ./playwright-core.tar.gz /tmp/playwright-core.tar.gz

# # 2. Bake in Playwright Agent.
# #    Playwright Agent is used to bake in browsers and browser dependencies,
# #    and run docker server later on.
# #    Browsers will be downloaded in `/ms-playwright`.
# #    Note: make sure to set 777 to the registry so that any user can access
# #    registry.
# RUN mkdir /ms-playwright && \
#     mkdir /ms-playwright-agent && \
#     cd /ms-playwright-agent && npm init -y && \
#     npm i /tmp/playwright-core.tar.gz && \
#     npm exec --no -- playwright-core mark-docker-image "${DOCKER_IMAGE_NAME_TEMPLATE}" && \
#     npm exec --no -- playwright-core install --with-deps && rm -rf /var/lib/apt/lists/* && \
#     rm /tmp/playwright-core.tar.gz && \
#     rm -rf /ms-playwright-agent && \
#     rm -rf ~/.npm/ && \
#     chmod -R 777 /ms-playwright

# CMD [ "node", "scan_ondemand.js" ]