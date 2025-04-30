FROM node:20

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

WORKDIR /app/build/src

ENV NODE_ENV="production"
ENV LOG_DIR="/app/logs"
ENV KEY_FILEPATH="/app/cert/key.pem"
ENV CERTIFICATE_FILEPATH="/app/cert/cert.pem"

CMD ["node", "index.js"]