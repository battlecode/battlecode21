FROM ubuntu:18.04

# Private key for gcloud authentication
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

# Insert shared codebase
COPY box box/
COPY app/config.py app/subscription.py app/util.py app/gcloud-key.json app/

WORKDIR box

# Configure SSH to GitHub
RUN chmod 600 .ssh/id_rsa && mkdir -p ~/.ssh
RUN ssh-keyscan github.com > githubKey \
  && ssh-keygen -lf githubKey | grep "SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8" \
  && cat githubKey >> ~/.ssh/known_hosts \
  && rm githubKey

# Initialise gradle
RUN ./gradlew --no-daemon build && rm -rf build src

WORKDIR /
