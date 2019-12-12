FROM bc20-matcher

COPY app/tournament_server.py app/bracket.py app/
CMD ./app/tournament_server.py
