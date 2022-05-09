![Docker Pulls](https://img.shields.io/docker/pulls/moers/mid-server?style=flat-square) ![Docker Cloud Build Status](https://img.shields.io/docker/cloud/build/moers/mid-server?style=flat-square) ![Build New MID Images](https://github.com/bmoers/docker-mid-server/workflows/Build%20New%20MID%20Images/badge.svg)


# ServiceNow MID Server

This is the full collection of all Service-Now MID Server versions as Docker container.

## A note on Apache Log4j Vulnerability (CVE-2021-44228)

> According to [KB1000959](https://support.servicenow.com/kb?id=kb_article_view&sysparm_article=KB1000959) the MID servers are not affected by this vulnerability.  
> However, as the MID Server **does** contain the files for log4j 2.14.0, theoretically the vulnerability is still present.
> Therefore the JndiLookup.class is removed from the log4j-core*.jar in all versions of the Docker MID server.  
> Make sure you pull the latest version of the Docker image.

## Supported tags

* latest MID of latest ServiceNow release
  * `latest`
* [city]:
  * `[city].latest`
  * `[city].[version]`
  * `[city].first`, `[city]`

Examples:

* sandiego:
  * `sandiego.latest`
  * `sandiego.05-02-2022_1316`
  * `sandiego.first`, `sandiego`

> If you need to start a specific version of MID server please have a look at the available [tags](https://hub.docker.com/r/moers/mid-server/tags)  
>
> If you're not sure what version you have, use the city-tag e.g. `moers/mid-server:rome`. The MID server will auto upgrade to the required version.

## ARM64 Images

> The upgrade process is not supported for ARM64 images.
> Therefore the ARM images are pinned to the exact version of the MID server and do not auto-upgrade.

## Dockerfile

All versions are based on the same [Dockerfile](https://github.com/bmoers/docker-mid-server/blob/master/docker/Dockerfile)

## Start a MID server instance

Mandatory parameters:

```bash
$ docker run -d --name docker-mid \
  --env SN_HOST_NAME=dev12345.service-now.com \
  --env USER_NAME=username \
  --env PASSWORD=password \
  moers/mid-server:latest
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
ENV CUSTOM_CA_CERT "custom cert in one line [optional]"
ENV CUSTOM_CA_ALIAS "alias used for the cert (default dockerExtraCaCerts) [optional]"
ENV HOST "the <host>.service-now.com subdomain [legacy]"
ENV EXT_PARAMS "additional parameters to be added or replaced in config.xml"
```

## Custom Ca Certificate

If you run the MID server behind a company firewall and need to inject a self signed certificate following options are available:

1. bind mount a custom.crt file to `/opt/agent/custom_ca.crt`
2. replace the new lines in the certificate with `\n` and set it to the `CUSTOM_CA_CERT` var.

## Extended Parameters

Use the EXT_PARAMS variable to add or update any parameter in the config.xml file.

Below JSON will add/update following parameter in the config.xml file:

* `<parameter name="mid.ssl.bootstrap.default.check_cert_revocation" value="false"/>`
* `<parameter name="mid.ssl.bootstrap.default.target_endpoint" value="sn.local"/>`

```json
[
    {
        "name": "mid.ssl.bootstrap.default.target_endpoint",
        "value": "sn.local",
        "type": "add"
    },
    {
        "name": "mid.ssl.bootstrap.default.check_cert_revocation",
        "value": "false"
    }
]
```

## Complete Example

```bash
$ docker run -d --name docker-mid-latest \
  --env SN_HOST_NAME=dev12345.service-now.com \
  --env USER_NAME=username \
  --env PASSWORD=password \
  --env PROXY=gateway.company.com \
  --env PROXY_PORT=8080 \
  -v "$(pwd)"/customer.crt:/opt/agent/custom_ca.crt \
  --env CUSTOM_CA_ALIAS=myCompanyCustomCrt \
  --env 'EXT_PARAMS=[{ "name": "mid.ssl.bootstrap.default.check_cert_revocation", "value": "false", "type":"update" }]' \
  --health-cmd='pgrep -af /opt/agent/bin/./wrapper-linux-x86-64 | grep `cat /opt/agent/work/mid.pid` || exit 1' \
  --health-interval=15s \
  --health-retries=6 \
  --health-timeout=5s \
  --health-start-period=30s \
  moers/mid-server:latest
```


## Versions

To get the latest available MID server use \
`:latest`

To get the latest available MID server for a specific ServiceNow release (city-tag)  use: \
`:[city].latest`

To get an MID server which will auto upgrade for a specific ServiceNow release use: \
`:[city]`

To pin a MID server to a specific version use the correct version tag and set the PIN  variable which will set the `mid.pinned.version` property e.g. \
`:newyork.06-19-2020_1844`
