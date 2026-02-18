FROM node:20-bookworm-slim

ARG NPM_CONFIG_STRICT_SSL=false
ENV NPM_CONFIG_STRICT_SSL=$NPM_CONFIG_STRICT_SSL
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm config set strict-ssl false && npm install --no-audit --no-fund
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 4000
CMD ["npm", "run", "dev"]
