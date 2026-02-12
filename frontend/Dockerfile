FROM node:20-alpine

ARG NPM_CONFIG_STRICT_SSL=false
ENV NPM_CONFIG_STRICT_SSL=$NPM_CONFIG_STRICT_SSL

WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
