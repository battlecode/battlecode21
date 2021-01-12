FROM bc21-worker

COPY app/game_server.py app/
# COPY maps box/maps/
CMD python3 /app/game_server.py
