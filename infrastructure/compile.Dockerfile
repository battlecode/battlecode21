FROM bc21-worker

COPY app/compile_server.py app/
CMD python3 /app/compile_server.py
