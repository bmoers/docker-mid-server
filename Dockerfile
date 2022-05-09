FROM docker

COPY --from=docker/buildx-bin:latest /buildx /usr/libexec/docker/cli-plugins/docker-buildx

RUN docker buildx create --name builderName && \
    docker buildx use builderName && \
    docker buildx inspect builderName --bootstrap 

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
