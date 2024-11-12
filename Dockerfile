FROM cgr.dev/chainguard/busybox:latest@sha256:257157f6c6aa88dd934dcf6c2f140e42c2653207302788c0ed3bebb91c5311e1

WORKDIR /app

COPY . .

# COPY package*.json ./
RUN ls
RUN rm -rf node_modules/
RUN ls
RUN npm install

EXPOSE 3000

CMD ["sh", "init.sh"]
