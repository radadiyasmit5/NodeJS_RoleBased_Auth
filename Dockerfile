FROM node:18.20.2@sha256:5bac3a1edff13e76586b8eaef1d411fcd80e4f18cce5bc40ea6993245e0721ec

WORKDIR /app

COPY . .

# COPY package*.json ./
RUN ls
RUN rm -rf node_modules/
RUN ls
RUN npm install

EXPOSE 3000

CMD ["sh", "init.sh"]
