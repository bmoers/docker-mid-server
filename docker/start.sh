#!/usr/bin/env bash
#set -x

#rm -rf /opt/agent/logs/*.*
#rm -rf /opt/agent/config.xml
#sed -i "s|10000000|5|g" /opt/agent/properties/glide.properties

CUSTOM_BIND_MOUNT=/opt/agent/custom_ca.crt
CUSTOM_CA_CERT_FILE=/opt/agent/cacerts.crt
CUSTOM_CA_ALIAS="${CUSTOM_CA_ALIAS:-dockerExtraCaCerts}"
WGET_CUSTOM_CACERT=""

# # # # #
# remove the pid file on start to avoid mid start to hang
# 
rm -rf /opt/agent/work/mid.pid


# # # # #
# Add custom ca cert to java keystore 
# either via $CUSTOM_BIND_MOUNT file or
# $CUSTOM_CA_CERT environment variable (text)
#

rm -rf ${CUSTOM_CA_CERT_FILE}

if [[ -f $CUSTOM_BIND_MOUNT ]]
then
    echo "DOCKER: using customCaCert via bind mount to $CUSTOM_BIND_MOUNT"
    cp $CUSTOM_BIND_MOUNT ${CUSTOM_CA_CERT_FILE}

elif [[ ! -z "$CUSTOM_CA_CERT" ]]
then
    echo "DOCKER: using customCaCert via environment variable \$CUSTOM_CA_CERT"
    echo -e $CUSTOM_CA_CERT > ${CUSTOM_CA_CERT_FILE}

fi

if [[ -f ${CUSTOM_CA_CERT_FILE} ]]
then
    WGET_CUSTOM_CACERT="--ca-certificate=${CUSTOM_CA_CERT_FILE}"

    if [[ `/opt/agent/jre/bin/keytool -keystore /opt/agent/jre/lib/security/cacerts -storepass changeit -noprompt --list | grep -i ${CUSTOM_CA_ALIAS}  | wc -l` == 0 ]]
    then 
        echo "DOCKER: adding customCaCert with alias '${CUSTOM_CA_ALIAS}' to /opt/agent/jre/lib/security/cacerts"
        /opt/agent/jre/bin/keytool -import -alias ${CUSTOM_CA_ALIAS} -file ${CUSTOM_CA_CERT_FILE} -keystore /opt/agent/jre/lib/security/cacerts -storepass changeit -noprompt
    else 
        echo "DOCKER: customCaCert already in /opt/agent/jre/lib/security/cacerts"
    fi 
else 
    echo "DOCKER: no customCaCert file defined"
fi

# # # # #
# Check if the mid server was registered correctly
#
# If the container is killed before the setup has completed and the MID
# was registered correctly, the sys_id is missing in the config.xml file
#
if [[ -f /opt/agent/config.xml ]]
then
    if [[ -z `grep -oP 'name="mid_sys_id" value="\K[^"]{32}' /opt/agent/config.xml` ]]
    then
        echo "Docker: config.xml invalid, reconfigure MID server"
        rm -rf /opt/agent/config.xml 
    fi
fi

# # # # #
# First run, configure the properties in config.xml
# subsequent run, ensure MID status is down
# 
if [[ ! -f /opt/agent/config.xml ]]
then
    
    cp /opt/config.xml /opt/agent/.
    
    if [[ ! -z "$SN_HOST_NAME" ]]
    then
        echo "Docker: configuring Host Name: $SN_HOST_NAME (using \$SN_HOST_NAME)"
        sed -i "s|https://YOUR_INSTANCE.service-now.com|https://${SN_HOST_NAME}|g" /opt/agent/config.xml
    elif [[ ! -z "$HOST" ]]
    then
        echo "Docker: configuring Host Name: ${HOST}.service-now.com (using \$HOST)"
        sed -i "s|https://YOUR_INSTANCE.service-now.com|https://${HOST}.service-now.com|g" /opt/agent/config.xml
    fi
    
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

    if [[ ! -z "$EXT_PARAMS" ]]
    then
        if [[ $EXT_PARAMS == \[* ]] 
        then
            echo "DOCKER: Processing extended parameters"

            for k in $(jq 'keys | .[]' <<< "$EXT_PARAMS"); do
                J_ROW=$(jq -r ".[$k]" <<< "$EXT_PARAMS");
                
                EXT_NAME=$(jq -r '.name' <<< "$J_ROW");
                EXT_VALUE=$(jq -r '.value' <<< "$J_ROW");
                EXT_TYPE=$(jq -r '.type' <<< "$J_ROW");

                EXT_CHECK=`grep -P "<parameter name=\"$EXT_NAME\"" /opt/agent/config.xml`
                if [[ "$EXT_TYPE" != "add" && -z "$EXT_CHECK" ]]
                then
                    EXT_TYPE="add"
                fi
                
                echo "DOCKER: Extended parameter - name: '$EXT_NAME', value: '$EXT_VALUE', type: '$EXT_TYPE'";

                if [[ "$EXT_TYPE" == "add" ]]
                then
                    sed -i "s|</parameters>|    <parameter name=\"${EXT_NAME}\" value=\"${EXT_VALUE}\"/>\n</parameters>|g" /opt/agent/config.xml
                else
                    sed -i "s|${EXT_CHECK}|    <parameter name=\"${EXT_NAME}\" value=\"${EXT_VALUE}\"/>|g" /opt/agent/config.xml
                fi

            done
        else
            echo "DOCKER: WARN 'EXT_PARAMS' must be an array!"
        fi
    fi
else 
    # if the MID server was killed while status was UP in servicenow
    # the start process hangs with error message about already a MID
    # running with the same name :-| to fix, ensure the status is DOWN

    echo "DOCKER: update MID sever status";

    SYS_ID=`grep -oP 'name="mid_sys_id" value="\K[^"]{32}' /opt/agent/config.xml`
    URL=`grep -oP '<parameter name="url" value="\K[^"]+' /opt/agent/config.xml`

    if [[ -z "$SYS_ID" || -z "$URL" ]]
    then
        echo "DOCKER: update MID sever status: SYS_ID ($SYS_ID) or URL ($URL) not specified!";
    else
        HTTP_PROXY=""
        if [[ ! -z "$PROXY" ]] 
        then
            HTTP_PROXY="$PROXY"
        fi

        if [[ ! -z "$PROXY_PORT" ]] 
        then
            HTTP_PROXY="${HTTP_PROXY}:${PROXY_PORT}"
        fi

        if [[ ! -z "$PROXY_USER" && ! -z "$PROXY_PASSWORD" ]]
        then
            HTTP_PROXY="${PROXY_USER}:${PROXY_PASSWORD}@${HTTP_PROXY}"
        fi

        if [[ ! -z "$HTTP_PROXY" ]]
            export http_proxy="http://${HTTP_PROXY}"
        then
            unset http_proxy
        fi

        echo "DOCKER: update MID sever status to DOWN";

        wget -O- --method=PUT --body-data='{"status":"Down"}' \
            --header='Content-Type:application/json' \
            --user "${USER_NAME}" --password "${PASSWORD}" \
            ${WGET_CUSTOM_CACERT} \
            "${URL}/api/now/table/ecc_agent/${SYS_ID}?sysparm_fields=status"
        echo -e ""
    fi

fi

logmon(){
    echo "DOCKER MONITOR: $1"
}

# SIGTERM-handler
term_handler() {
    echo "DOCKER: Stop MID server"
    /opt/agent/bin/mid.sh stop & wait ${!}
    exit 143; # 128 + 15 -- SIGTERM
}

trap 'kill ${!}; term_handler' SIGTERM

touch /opt/agent/logs/agent0.log.0
 
echo "DOCKER: Start MID server"
/opt/agent/bin/mid.sh start &


# # # # # # # # #
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
    logmon "${log_file} last updated ${ctime_diff} sec ago"

    if [ "${ctime_diff}" -ge "${ctime_max}" ]; then
        logmon "${log_file} was not updated for ${ctime_max}sec, MID server potentially frozen."
        logmon "Stopping MID server process $pid now!"
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
