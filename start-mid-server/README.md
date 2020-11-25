# MID Docker Starter

## Auto-City-Tag

This will automatically start a new mid-server container with the correct city-tag.

## RUN

To start a new MID server on you current Docker environment, run:

```bash
docker run --rm -it \
    --env SN_HOST_NAME=dev12345 \
    --env USER_NAME=username \
    --env PASSWORD=password \
    -v /var/run/docker.sock:/var/run/docker.sock \
    $(docker build -q .)
```
