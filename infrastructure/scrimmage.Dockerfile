FROM bc20-env

# Install software dependencies
RUN pip3 install --upgrade \
    apscheduler \
    requests

COPY config.py util.py scrimmage.py app/
CMD /app/scrimmage.py
