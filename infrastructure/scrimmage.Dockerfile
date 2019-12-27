FROM bc20-matcher

COPY app/scrimmage_server.py app/
CMD ./app/scrimmage_server.py
