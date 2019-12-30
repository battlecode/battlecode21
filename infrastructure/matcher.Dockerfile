FROM ubuntu:18.04

# Install software dependencies
RUN apt-get update \
  && apt-get install -y \
    python3 \
    python3-pip
RUN pip3 install --upgrade \
    requests

# Insert shared codebase
COPY app/config.py app/util.py app/
