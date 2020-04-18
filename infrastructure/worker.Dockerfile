FROM bh20-env

# Private key for gcloud authentication
ENV GOOGLE_APPLICATION_CREDENTIALS /app/gcloud-key.json

# Install software dependencies
# Need g++ for pip to successfully install google cloud dependencies
RUN apk --update --no-cache add \
    g++ \
    # openjdk8 \
    zip \
    git \
    openssh
    
# set grpcio (dependency of pubsub) to use older version
# to make it actually work
RUN pip3 install grpcio==1.25.0

# install python stuffs
RUN pip3 install --upgrade \
    google-cloud-pubsub \
    google-cloud-storage \
    requests

# Initialise box, copy files and worker apps
# COPY box box/
COPY app/config.py app/subscription.py app/util.py app/id_rsa app/gcloud-key.json app/

# Copy github's RSA key
COPY .ssh /root/.ssh
# Init ssh and clone the repo with the deploy key
RUN mkdir box \
    && cd box && git clone https://github.com/battlecode/battlehack20.git /box/

# Clean up everything in the battlehack repo we don't need
RUN rm -rf box/backend box/frontend box/infrastructure box/specs \
    && rm box/docker-compose.yml box/docker-compose-b.yml box/LICENSE box/RELEASE.md box/release.py box/README.md
