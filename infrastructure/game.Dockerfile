FROM bc20-worker

COPY app/game_server.py app/
CMD ./app/game_server.py
