FROM bc21-worker

COPY app/compile_server.py app/
CMD /app/compile_server.py
