FROM node:20

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

WORKDIR /app/build/src

ENV HOST=0.0.0.0
ENV PORT=80
ENV KEY_FILEPATH="/app/cert/key.pem"
ENV CERTIFICATE_FILEPATH="/app/cert/cert.pem"

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --start-interval=1s --retries=3 CMD curl -f http://localhost:80/healthcheck || exit 1

CMD ["node", "index.js"]