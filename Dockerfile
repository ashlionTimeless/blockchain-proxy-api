FROM node:10

WORKDIR /usr/src/app

COPY package*.json ./

#RUN apt-get install libstdc++6
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]


