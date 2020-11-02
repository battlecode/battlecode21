FROM bc20-env

# Private key for gcloud authentication
ENV GOOGLE_APPLICATION_CREDENTIALS /app/gcloud-key.json

# Install software dependencies
# Need g++ for pip to successfully install google cloud dependencies
RUN apk --update --no-cache add \
    g++ \
    openjdk8 \
    zip
RUN pip3 install --upgrade \
    google-cloud-pubsub \
    google-cloud-storage \
    requests

# Initialise box and gradle
COPY box box/
RUN cd box && ./gradlew --no-daemon build && rm -rf build src

COPY app/config.py app/subscription.py app/util.py app/gcloud-key.json app/
