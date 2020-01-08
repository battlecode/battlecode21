FROM bc20-env

# Install software dependencies
RUN pip3 install --upgrade \
    requests
COPY * app/

CMD /app/tournament_server.py
