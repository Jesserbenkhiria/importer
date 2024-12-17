# Use a newer version of Node.js (e.g., node:18 or node:20)
FROM node:18

# Install the latest version of npm
RUN npm install -g npm@latest

# Set the working directory (root of the project)
WORKDIR /app

# Copy the entire project (root-level files and directories)
COPY . .

# Clean the npm cache (in case of cache corruption)
RUN npm cache clean --force

# Install root-level dependencies (including shopify-cli)
RUN npm install

# Install backend dependencies
WORKDIR /app/web
RUN npm install

# Install frontend dependencies
WORKDIR /app/web/frontend
RUN npm install

# Set the SHOPIFY_API_KEY environment variable
ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=3415f480361def1cf020d4ed594fdeef

# Build frontend assets 
RUN npm run build

# Expose ports for backend and frontend
EXPOSE 3000 5173

# Ensure that the command runs from the root directory
WORKDIR /app

# Default command to run the Shopify app using npx from the root directory
CMD ["npm", "run", "dev"]
