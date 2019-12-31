FROM bc20-env

# Install software dependencies
RUN apt-get update \
  && apt-get install -y \
    cron \
    curl \
    jq

# Set up crontab
COPY crontab etc/cron.d/scrimmage-cron
COPY *.sh app/
RUN chmod 0644 /etc/cron.d/scrimmage-cron \
  && chmod 0755 /app/*.sh \
  && crontab /etc/cron.d/scrimmage-cron

CMD /app/startup.sh
