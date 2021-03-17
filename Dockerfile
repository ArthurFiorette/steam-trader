FROM node:14.16-alpine

WORKDIR /usr/app

COPY . .

RUN npm run install
RUN npm run build

ENV NODE_ENV=production

CMD ["npm", "run", "start"]