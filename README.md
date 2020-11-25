![Docker Pulls](https://img.shields.io/docker/pulls/moers/mid-server?style=flat-square) ![Docker Cloud Build Status](https://img.shields.io/docker/cloud/build/moers/mid-server?style=flat-square) ![Build New MID Images](https://github.com/bmoers/docker-mid-server/workflows/Build%20New%20MID%20Images/badge.svg)


# ServiceNow MID Server

This is the full collection of all Service-Now MID Server versions as Docker container.

## Supported tags

* latest MID of latest ServiceNow release
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
$ docker run -d --name docker-mid-madrid \
  --env SN_HOST_NAME=dev12345.service-now.com \
  --env USER_NAME=username \
  --env PASSWORD=password \
  moers/mid-server:madrid
```

## Supported Environment Variables

```bash
ENV SN_HOST_NAME "FQDN of the ServiceNow instance (replacement for $HOST)"
ENV USER_NAME "mid user name"
ENV PASSWORD "mid user password"
ENV HOSTNAME "the MID server name (suffixed by '-mid.docker') [optional]"
ENV PIN "disable auto upgrade and pin the mid to this version [optional]"
ENV PROXY "proxy-host [optional]"
ENV PROXY_PORT "proxy-port [optional]"
ENV HOST "the <host>.service-now.com subdomain [legacy]"
```

## Versions

To get the latest available MID server use \
`:latest`

To get the latest available MID server for a specific ServiceNow release (city-tag)  use: \
`:city.latest`

To get an exact MID server which will auto upgrade for a specific ServiceNow release use: \
`:city`
