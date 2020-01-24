#!/usr/bin/env bash
#set -x

#rm -rf /opt/agent/logs/*.*
#rm -rf /opt/agent/config.xml
#sed -i "s|10000000|5|g" /opt/agent/properties/glide.properties

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

logmon(){
    echo "DOCKER MONITOR: $1"
}

# SIGTERM-handler
term_handler() {
    echo "DOCKER: stop mid server"
    /opt/agent/bin/mid.sh stop & wait ${!}
    exit 143; # 128 + 15 -- SIGTERM
}

trap 'kill ${!}; term_handler' SIGTERM

touch /opt/agent/logs/agent0.log.0
 
echo "DOCKER: start mid server"
/opt/agent/bin/mid.sh start &


## # # # # # # #
# Logfile Monitor
# if by any chance the MID server hangs (e.g. upgrade) the log file will not be updated
# in that case force the container to stop
#

# log file to check
log_file=/opt/agent/logs/agent0.log.0

# max age of log file
ctime_max=300

# interval to check the log file
log_interval=30

# pid of this shell process
pid=$$

while true
do
    # check last log modification time
    ctime="$(ls ${log_file} --time=ctime -l --time-style=+%s | awk '{ print $6 }')"
    ctime_current="$(date +%s)"
    ctime_diff="$((ctime_current-ctime))"
    #logmon "${log_file} last updated ${ctime_diff} sec ago"
    
    if [ "${ctime_diff}" -ge "${ctime_max}" ]; then
        logmon "${log_file} was not updated for ${ctime_max}sec, MID server potentially frozen."
        logmon "Stopping MID server now!"
        kill -TERM $pid
        break
    else
        #logmon "sleep"
        sleep $log_interval
    fi
done  &

# show the logs in the console
while true
do
    tail -F /opt/agent/logs/agent0.log.0 & wait ${!}
done
