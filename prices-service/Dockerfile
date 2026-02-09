FROM node:22-alpine

WORKDIR /app

RUN npm install -g pm2

COPY package*.json ./
RUN npm ci --only=production

COPY . .

COPY ecosystem.config.cjs .

CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]