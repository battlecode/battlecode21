FROM bc20-env

# Install software dependencies
RUN pip3 install --upgrade \
    requests

COPY config.py util.py bracket.py team_names tournament_server.py app/
CMD /app/tournament_server.py
