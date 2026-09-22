FROM node:22.13

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5000