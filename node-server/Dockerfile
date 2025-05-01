FROM node:20

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

WORKDIR /app/build/src

ENV KEY_FILEPATH="/app/cert/key.pem"
ENV CERTIFICATE_FILEPATH="/app/cert/cert.pem"

CMD ["node", "index.js"]