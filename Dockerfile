FROM node:18-alpine

WORKDIR /app

COPY travel-server/package*.json ./

RUN npm install --production

COPY travel-server/ .

EXPOSE 80

CMD ["npm", "start"]