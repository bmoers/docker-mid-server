# ServiceNow MID Server

This is the full collection of all ServiceNow MID Server versions as Docker container.

## Supported tags

* latest
* newyork:
  * newyork.latest
  * newyork.first, newyork
* madrid:
  * madrid.latest
  * madrid.first, madrid
* london:
  * london.latest
  * london.first, london

## Dockerfile

All versions are based on the same [Dockerfile](https://github.com/bmoers/docker-mid-server/blob/master/docker/Dockerfile)

## Start a MID server instance

To use it run:

```bash
$ docker run -d --name docker-mid-london \
  --env HOST=dev12345 \
  --env USER_NAME=username \
  --env PASSWORD=password \
  moers/mid-server:latest
```

## Supported Environment Variables

```bash
ENV HOST "the service-now host name"
ENV USER_NAME "mid user name"
ENV PASSWORD "mid user password"
ENV PROXY "proxy-host [optional]"
ENV PROXY_PORT "proxy-port [optional]"
```

## Versions

To get the latest available MID server use \
`:latest`

To get the latest available MID server for a specific ServiceNow release (city)  use: \
`:city.latest`

To get an exact MID server which will auto upgrade for a specific ServiceNow release use: \
`:city.first`


