# MID server test

* add custom_ca.crt to /test
  * eg. https://crt.sh/?q=DST+Root+CA
* create /test/.env with following vars
  * USER_NAME
  * PASSWORD
  * PROXY
  * PROXY_PORT
  * CUSTOM_SN_HOST
  * CUSTOM_CA_CERT
  * CUSTOM_CA_ALIAS
* start server `docker-compose -f docker-compose.test.yml up --build`
