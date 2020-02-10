FROM bc20-env

# Install software dependencies
RUN pip3 install --upgrade \
    requests

COPY config.py util.py bracketlib.py team_pk team_names maps.json tournament_server.py app/

WORKDIR app
CMD ./tournament_server.py 7 team_pk team_names maps.json
