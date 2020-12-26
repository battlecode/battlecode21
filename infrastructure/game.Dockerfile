FROM bc21-worker

COPY app/game_server.py app/
# COPY maps box/maps/
CMD /app/game_server.py
