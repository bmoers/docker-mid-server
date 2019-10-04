#!/usr/bin/env bash
#set -x

pid=0

#rm -rf /opt/agent/logs/*.*
#rm -rf /opt/agent/config.xml 

if [[ ! -f /opt/agent/config.xml ]]
then

    cp /opt/config.xml /opt/agent/.

    sed -i "s|https://YOUR_INSTANCE.service-now.com|https://${HOST}.service-now.com|g" /opt/agent/config.xml
    sed -i "s|YOUR_INSTANCE_USER_NAME_HERE|${USER_NAME}|g" /opt/agent/config.xml
    sed -i "s|YOUR_INSTANCE_PASSWORD_HERE|${PASSWORD}|g" /opt/agent/config.xml
    sed -i "s|YOUR_MIDSERVER_NAME_GOES_HERE|${HOSTNAME}-mid.docker|g" /opt/agent/config.xml

    if [[ ! -z "$PIN" ]] 
    then
        sed -i "s|</parameters>|    <parameter name=\"mid.pinned.version\" value=\"${PIN}\"/>\n\n</parameters>|g" /opt/agent/config.xml
    fi

    if [[ ! -z "$PROXY" ]] 
    then
        sed -i "s|</parameters>|    <parameter name=\"mid.proxy.use_proxy\" value=\"true\"/>\n\n</parameters>|g" /opt/agent/config.xml
        sed -i "s|</parameters>|    <parameter name=\"mid.proxy.host\" value=\"${PROXY}\"/>\n\n</parameters>|g" /opt/agent/config.xml
    fi
    if [[ ! -z "$PROXY_PORT" ]] 
    then
        sed -i "s|</parameters>|    <parameter name=\"mid.proxy.port\" value=\"${PROXY_PORT}\"/>\n\n</parameters>|g" /opt/agent/config.xml
    fi

    if [[ ! -z "$PROXY_USER" ]] 
    then
        sed -i "s|</parameters>|    <parameter name=\"mid.proxy.username\" value=\"${PROXY_USER}\"/>\n\n</parameters>|g" /opt/agent/config.xml
    fi
    if [[ ! -z "$PROXY_PASSWORD" ]] 
    then
        sed -i "s|</parameters>|    <parameter name=\"mid.proxy.password\" value=\"${PROXY_PASSWORD}\" encrypt=\"true\"/>\n\n</parameters>|g" /opt/agent/config.xml
    fi
fi


# SIGTERM-handler
term_handler() {
    echo "stop mid server"
    /opt/agent/bin/mid.sh stop &
    pid="$!"
    wait $pid
    exit 143; # 128 + 15 -- SIGTERM
}

trap 'kill ${!}; term_handler' SIGTERM

touch /opt/agent/logs/agent0.log.0

echo "start mid server"
/opt/agent/bin/mid.sh start &

tail -f /opt/agent/logs/agent0.log.0 & wait ${!}