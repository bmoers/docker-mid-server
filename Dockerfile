FROM docker:20.10.17

COPY --from=docker/buildx-bin:v0.9 /buildx /usr/libexec/docker/cli-plugins/docker-buildx

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
#
#   The MID Server image can be found here:
#   https://github.com/bmoers/docker-mid-server/blob/master/docker/Dockerfile
#
#   This Dockerfile is only to refresh the MID docker images
#
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

RUN apk add --update nodejs \
    npm \
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
