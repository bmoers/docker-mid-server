FROM alpine:latest


#RUN addgroup -g 1000 node \
#    && adduser -u 1000 -G node -s /bin/sh -D node \
#    && apk add --update nodejs nodejs-npm docker openrc bash

RUN apk add --update nodejs \
    nodejs-npm \
    docker \
    openrc \
    bash && \
    rm -rf /var/cache/apk/*

RUN mkdir /opt/node
WORKDIR /opt/node

COPY package*.json ./

RUN npm install --no-optional && npm cache clean --force

COPY ./app.js .

CMD node app.js
