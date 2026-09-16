FROM node:22-alpine

WORKDIR /app

# Accept environment build arguments from docker-compose / .env
ARG VITE_API_URL=/api
ARG VITE_SOCKET_URL=
ARG VITE_TINY_MCE_API_KEY=

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_TINY_MCE_API_KEY=$VITE_TINY_MCE_API_KEY

# Copy dependency manifests first for optimal Docker layer caching
COPY package*.json ./

# Install dependencies and clear npm cache to keep image lean
RUN npm install --no-audit --prefer-offline && npm cache clean --force

# Copy application source code
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "--force"]
