FROM bc20-env

# Install software dependencies
RUN pip3 install --upgrade \
    requests

COPY config.py util.py bracketlib.py team_pk team_names maps.json tournament_server.py app/
CMD /app/tournament_server.py
