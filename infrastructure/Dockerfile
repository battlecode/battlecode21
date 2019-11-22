FROM ubuntu:18.04

# Insert codebase
COPY . /
ENV GOOGLE_APPLICATION_CREDENTIALS /app/gcloud-key.json

# Install software dependencies
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

# Configure SSH to GitHub
RUN chmod 600 .ssh/id_rsa && mkdir -p ~/.ssh
RUN ssh-keyscan github.com > githubKey \
  && ssh-keygen -lf githubKey | grep "SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8" \
  && cat githubKey >> ~/.ssh/known_hosts \
  && rm githubKey

# Initialise gradle
RUN ./gradlew build && rm -rf build src

WORKDIR /
