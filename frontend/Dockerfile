FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests first for optimal Docker layer caching
COPY package*.json ./

# Install dependencies and clear npm cache to keep image lean
RUN npm install --no-audit --prefer-offline && npm cache clean --force

# Copy application source code
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
