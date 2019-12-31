FROM bc20-env

# Install software dependencies
RUN apt-get update \
  && apt-get install -y \
    python3 \
    python3-pip
RUN pip3 install --upgrade \
    requests

COPY * app/

CMD ./app/tournament_server.py
