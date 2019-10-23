# Basic Dockerfile configuration
basic:
	>  Dockerfile echo "FROM ubuntu:18.04"
	>> Dockerfile echo "COPY pubsub /app"
	>> Dockerfile echo "ENV GOOGLE_APPLICATION_CREDENTIALS /app/gcloud-key.json"
	>> Dockerfile echo "RUN apt-get update"
	>> Dockerfile echo "RUN apt-get -y install python3 python3-pip libpq-dev"
	>> Dockerfile echo "RUN pip3 install --upgrade google-cloud-pubsub google-cloud-storage psycopg2"

# For debugging; can manually spawn a shell
shell: basic
	>> Dockerfile echo "CMD while true; do sleep 10; done"
	docker build -t bc20_shell .

# Compilation server
compile: basic
	>> Dockerfile echo "RUN apt-get -y install unzip"
	>> Dockerfile echo "CMD ./app/compile_server.py"
	docker build -t bc20_compile .
	docker save bc20_compile > bc20_compile.tar

# Game runner server
game: basic
	>> Dockerfile echo "CMD ./app/game_server.py"
	docker build -t bc20_game .
	docker save bc20_game > bc20_game.tar

clean:
	rm -f Dockerfile
	docker rmi -f bc20_shell bc20_compile bc20_game

.PHONY: shell, basic, compile, game, clean
