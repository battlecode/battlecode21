FROM bc21-env

# Private key for gcloud authentication
ENV GOOGLE_APPLICATION_CREDENTIALS /app/gcloud-key.json

# # Install software dependencies
RUN apt-get update \
    && apt-get install -y apt-transport-https ca-certificates wget dirmngr gnupg software-properties-common \
    && wget -qO - https://adoptopenjdk.jfrog.io/adoptopenjdk/api/gpg/key/public | apt-key add - \
    && add-apt-repository --yes https://adoptopenjdk.jfrog.io/adoptopenjdk/deb/ \
    && apt-get update \ 
# install without prompt
    && apt-get install -y \
        adoptopenjdk-8-hotspot \
        # Need g++ for pip to successfully install google cloud dependencies
        g++ \
        zip

RUN pip3 install --upgrade \
    requests \
    google-cloud-pubsub \
    google-cloud-storage 

# # Initialise box and game dependencies
COPY box box/
RUN cd box && ./gradlew --no-daemon build && rm -rf build src

COPY app/config.py app/subscription.py app/util.py app/gcloud-key.json app/
