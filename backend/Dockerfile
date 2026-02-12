FROM node:20-alpine

ARG NPM_CONFIG_STRICT_SSL=false
ENV NPM_CONFIG_STRICT_SSL=$NPM_CONFIG_STRICT_SSL

WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "run", "dev"]
