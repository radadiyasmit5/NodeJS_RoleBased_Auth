FROM node:18.20.2@sha256:3a17df2ede55682bccb79e45d71b5213295ce5eae25a0816877b0e548595de1b

WORKDIR /app

COPY . .

# COPY package*.json ./
RUN ls
RUN rm -rf node_modules/
RUN ls
RUN npm install

EXPOSE 3000

CMD ["sh", "init.sh"]
