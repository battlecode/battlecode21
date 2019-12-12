FROM ubuntu:18.04

# Private key for gcloud authentication
ENV GOOGLE_APPLICATION_CREDENTIALS /app/gcloud-key.json

# Install software dependencies
RUN apt-get update \
  && apt-get install -y \
    python3 \
    python3-pip
RUN pip3 install --upgrade \
    requests

# Insert codebase
COPY app /app
