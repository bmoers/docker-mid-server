# ServiceNow MID Server

This is the full collection of all Service-Now MID Server versions as Docker container.

## Supported tags

* latest MID of newest ServiceNow release
  * `latest`
* newyork:
  * `newyork.latest`
  * `newyork.first`, `newyork`
* madrid:
  * `madrid.latest`
  * `madrid.first`, `madrid`
* london:
  * `london.latest`
  * `london.first`, `london`

> If you need to start a specific version of MID server please have a look at the available [tags](https://hub.docker.com/r/moers/mid-server/tags)

> If you're not sure what version you have, use the city-tag e.g. `moers/mid-server:madrid`. The MID server will auto upgrade to the required version.

## Dockerfile

All versions are based on the same [Dockerfile](https://github.com/bmoers/docker-mid-server/blob/master/docker/Dockerfile)

## Start a MID server instance

To use it run:

```bash
$ docker run -d --name docker-mid-london \
  --env HOST=dev12345 \
  --env USER_NAME=username \
  --env PASSWORD=password \
  moers/mid-server:madrid
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
`:city`


