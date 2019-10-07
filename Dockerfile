FROM alpine:latest

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
#
#   The MID Server image can be found here:
#   https://github.com/bmoers/docker-mid-server/blob/master/docker/Dockerfile
#
#   This Dockerfile is only to refresh the MID docker images
#
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

RUN apk add --update nodejs \
    nodejs-npm \
    docker \
    openrc \
    bash && \
    rm -rf /var/cache/apk/*

RUN mkdir /opt/node
WORKDIR /opt/node

COPY docker/ ./docker
COPY package*.json ./

RUN npm install --no-optional && npm cache clean --force

COPY ./app.js .

CMD node app.js
