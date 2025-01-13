FROM node:lts-alpine
WORKDIR /app
COPY . .
RUN apk update && apk add --no-cache openssl
RUN npm install
EXPOSE 8080
CMD ["sh", "./start-docker.sh"]
