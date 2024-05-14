FROM node:16

WORKDIR /app

COPY . .

# COPY package*.json ./

RUN npm install

EXPOSE 3000

CMD ["sh", "init.sh"]
