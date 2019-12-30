FROM ubuntu:18.04

# Private key for gcloud authentication
ENV GOOGLE_APPLICATION_CREDENTIALS /app/gcloud-key.json

# Install software dependencies
RUN apt-get update \
  && apt-get install -y \
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

# Initialise gradle
WORKDIR box
RUN ./gradlew --no-daemon build && rm -rf build src
WORKDIR /
