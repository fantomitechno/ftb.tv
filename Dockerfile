FROM node:lts AS runtime
WORKDIR /app

COPY . .


RUN npm install
RUN npm run build

CMD node .