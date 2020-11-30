FROM bc20-env

# Install software dependencies
RUN pip3 install --upgrade \
    requests

# COPY config.py util.py bracketlib.py team_pk team_names tournament_server.py app/

WORKDIR app
CMD ./tournament_server.py
