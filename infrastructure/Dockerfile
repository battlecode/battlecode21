FROM ubuntu:18.04

COPY . /
ENV GOOGLE_APPLICATION_CREDENTIALS /app/gcloud-key.json

RUN apt-get update \
  && apt-get install -y \
    git \
    openjdk-8-jdk \
    python3 \
    python3-pip \
    zip
RUN pip3 install --upgrade \
    google-cloud-pubsub \
    google-cloud-storage \
    requests

WORKDIR box

RUN chmod 600 .ssh/id_rsa
RUN mkdir -p ~/.ssh
RUN ["/bin/bash", "-c", "set -o pipefail \
  && ssh-keyscan github.com > githubKey \
  && ssh-keygen -lf githubKey | grep \"SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8\" \
  && cat githubKey >> ~/.ssh/known_hosts \
  && rm githubKey"]
RUN ./gradlew

WORKDIR /
