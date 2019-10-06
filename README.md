# ServiceNow MID Server

This is the full collection of all ServiceNow MID Server versions as Docker container.

## Supported tags

* newyork:
    * latest, newyork.latest, newyork.patch1-hotfix1-09-04-2019, newyork.pin.patch1-hotfix1-09-04-2019, newyork.patch1-08-14-2019, newyork.pin.patch1-08-14-2019
* madrid:
    * madrid.latest madrid.patch4b-hotfix1-09-03-2019, madrid.pin.patch4b-hotfix1-09-03-2019, madrid.patch6-hotfix1-08-12-2019, madrid.pin.patch6-hotfix1-08-12-2019, madrid.patch6-07-24-2019, madrid.pin.patch6-07-24-2019, madrid.patch4-hotfix1-07-01-2019, madrid.pin.patch4-hotfix1-07-01-2019, madrid.patch5-06-26-2019, madrid.pin.patch5-06-26-2019, madrid.patch4-05-29-2019, madrid.pin.patch4-05-29-2019, madrid.patch3-hotfix2-05-17-2019, madrid.pin.patch3-hotfix2-05-17-2019, madrid.patch3-hotfix1-05-09-2019, madrid.pin.patch3-hotfix1-05-09-2019, madrid.patch3-04-24-2019, madrid.pin.patch3-04-24-2019, madrid.patch2-03-20-2019, madrid.pin.patch2-03-20-2019, madrid.patch1-hotfix2-03-14-2019, madrid.pin.patch1-hotfix2-03-14-2019, madrid.patch1-hotfix1-03-08-2019, madrid.pin.patch1-hotfix1-03-08-2019, madrid.patch1-02-13-2019, madrid.pin.patch1-02-13-2019, madrid.patch0-hotfix1-01-31-2019, madrid.pin.patch0-hotfix1-01-31-2019
* london:
    * london.latest, london.patch8-hotfix4-07-16-2019, london.pin.patch8-hotfix4-07-16-2019, london.patch9-hotfix1-07-09-2019, london.pin.patch9-hotfix1-07-09-2019, london.patch8-hotfix3-06-21-2019, london.pin.patch8-hotfix3-06-21-2019, london.patch6b-hotfix1-06-20-2019, london.pin.patch6b-hotfix1-06-20-2019, london.patch9-06-19-2019, london.pin.patch9-06-19-2019, london.patch6a-hotfix1-05-03-2019, london.pin.patch6a-hotfix1-05-03-2019, london.patch7-hotfix2-04-29-2019, london.pin.patch7-hotfix2-04-29-2019, london.patch8-04-17-2019, london.pin.patch8-04-17-2019, london.patch7-hotfix1-04-04-2019, london.pin.patch7-hotfix1-04-04-2019, london.patch7-03-13-2019, london.pin.patch7-03-13-2019, london.patch6-hotfix1-02-27-2019, london.pin.patch6-hotfix1-02-27-2019, london.patch4-hotfix6-02-13-2019, london.pin.patch4-hotfix6-02-13-2019, london.patch6-02-06-2019, london.pin.patch6-02-06-2019, london.patch4-hotfix5-02-08-2019, london.pin.patch4-hotfix5-02-08-2019, london.patch5-hotfix1-01-29-2019, london.pin.patch5-hotfix1-01-29-2019, london.patch4-hotfix4-01-17-2019, london.pin.patch4-hotfix4-01-17-2019, london.patch5-01-03-2019, london.pin.patch5-01-03-2019, london.patch4-hotfix3-01-10-2019, london.pin.patch4-hotfix3-01-10-2019, london.patch3-hotfix4-01-03-2019, london.pin.patch3-hotfix4-01-03-2019, london.patch4-hotfix2-12-20-2018, london.pin.patch4-hotfix2-12-20-2018, london.patch4-hotfix1-12-11-2018, london.pin.patch4-hotfix1-12-11-2018, london.patch3-hotfix3-12-03-2018, london.pin.patch3-hotfix3-12-03-2018, london.patch4-11-21-2018, london.pin.patch4-11-21-2018, london.patch2-hotfix5-11-22-201, london.pin.patch2-hotfix5-11-22-201, london.patch3-10-24-2018, london.pin.patch3-10-24-2018, london.patch2-hotfix4-11-02-2018, london.pin.patch2-hotfix4-11-02-2018, london.patch2-hotfix2-10-15-2018, london.pin.patch2-hotfix2-10-15-2018, london.patch1-hotfix3-09-21-2018, london.pin.patch1-hotfix3-09-21-2018, london.patch2-09-19-2018, london.pin.patch2-09-19-2018, london.patch1-hotfix2-09-10-2018, london.pin.patch1-hotfix2-09-10-2018, london.patch1-08-15-2018, london.pin.patch1-08-15-2018

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
`:city.version`

To get an exact (pinned) MID server for a specific ServiceNow release use: \
`:city.pin.version`

