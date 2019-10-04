FROM ubuntu:latest

RUN mkdir -p /opt && \
    groupadd -g 999 mid && \
    useradd -r -u 999 -g mid mid

RUN apt-get -q update && apt-get install -qy unzip \
    wget \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /tmp/*

ARG VERSION="london-06-27-2018__patch10-08-28-2019"
ARG URL="https://install.service-now.com/glide/distribution/builds/package/mid/2019/09/06/mid.london-06-27-2018__patch10-08-28-2019_09-06-2019_0928.linux.x86-64.zip"

ENV HOST "default-host"
ENV USER_NAME "default-user"
ENV PASSWORD "default-password"
ENV PROXY ""
ENV PROXY_PORT ""
ENV PIN ${VERSION}

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

ADD ./start.sh /opt
RUN chmod +x /opt/start.sh

USER mid

CMD ["/opt/start.sh"]




