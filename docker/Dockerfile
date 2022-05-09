FROM ubuntu:20.04

RUN mkdir -p /opt && \
    groupadd -g 999 mid && \
    useradd -r -u 999 -g mid mid

RUN apt-get -q update && apt-get install -qy unzip \
    wget vim curl iputils-ping jq && \ 
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /tmp/*

ENV HOST "default-host"
ENV SN_HOST_NAME ""
ENV USER_NAME "default-user"
ENV PASSWORD "default-password"
ENV PROXY ""
ENV PROXY_PORT ""

ARG URL
RUN echo "mid binary url: ${URL}"
# URL is mandatory
RUN test -n "$URL"

ARG VERSION
ENV PIN ${VERSION}
RUN echo "pinned to version: ${VERSION}"

RUN wget --progress=bar:force --no-check-certificate \
    ${URL} -O /tmp/mid.zip && \
    unzip -d /opt /tmp/mid.zip && \
    chmod -R 755 /opt/agent && \
    chown -R mid:mid /opt/* && \
    mv /opt/agent/config.xml /opt/. && \
    rm -rf /tmp/*

RUN /bin/bash -c 'if [[ ! -d "/opt/agent/jre" || `dpkg --print-architecture` == "arm64" ]] ; then \
    apt-get -q update && \
    apt-get install -qy openjdk-11-jre && \
    update-alternatives --config java && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /tmp/* && \
    rm -rf /opt/agent/jre && \
    rm /usr/lib/jvm/java-11-openjdk-arm64/lib/security/blacklisted.certs  && \
    cp -R --dereference /usr/lib/jvm/java-11-openjdk-arm64 /opt/agent/jre && \
    chown -R mid:mid /opt/agent/jre/lib/security \
    ; fi'

# install additional packages
RUN apt-get -q update && \
    apt-get install -qy \
    nmap \ 
    dnsutils \ 
    net-tools \ 
    lsof \
    zip && \ 
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /tmp/*

# mitigate CVE-2021-44228 Log4j and remove the JndiLookup class from the core jar
RUN zip -q -d /opt/agent/lib/log4j-core*.jar org/apache/logging/log4j/core/lookup/JndiLookup.class || true

ARG ARM_VERSION
ENV ARM_VERSION ${ARM_VERSION}

# HEALTHCHECK --interval=15s --retries=6 --timeout=5s --start-period=30s CMD pgrep -af /opt/agent/bin/./wrapper-linux-x86-64 | grep `cat /opt/agent/work/mid.pid` || exit 1 

ADD ./start.sh /opt
RUN chmod +x /opt/start.sh

USER mid

CMD ["/opt/start.sh"]
