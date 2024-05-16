FROM node:18.20.2

WORKDIR /app

COPY . .

# COPY package*.json ./
RUN ls
RUN rm -rf node_modules/
RUN ls
RUN npm install

EXPOSE 3000

CMD ["sh", "init.sh"]
