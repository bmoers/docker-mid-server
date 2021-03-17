FROM ubuntu:latest

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

RUN /bin/bash -c 'if [[ ! -d "/opt/agent/jre" ]] ; then apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends software-properties-common && \
    add-apt-repository -y ppa:openjdk-r/ppa && \
    apt-get update && \
    apt-get install -y openjdk-8-jre && \
    update-alternatives --config java && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /tmp/* && \
    ln -s /usr/lib/jvm/java-8-openjdk-amd64/jre /opt/agent/. \
    ; fi'

# HEALTHCHECK --interval=15s --retries=6 --timeout=5s --start-period=30s CMD pgrep -af /opt/agent/bin/./wrapper-linux-x86-64 | grep `cat /opt/agent/work/mid.pid` || exit 1 

ADD ./start.sh /opt
RUN chmod +x /opt/start.sh

USER mid

CMD ["/opt/start.sh"]
