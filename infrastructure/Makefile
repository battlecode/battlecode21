all: basic compile game tarballs

# Basic Dockerfile configuration
basic:
	>  Dockerfile echo "FROM ubuntu:18.04"
	>> Dockerfile echo "COPY servers /app"
	>> Dockerfile echo "ENV GOOGLE_APPLICATION_CREDENTIALS /app/gcloud-key.json"
	>> Dockerfile echo "RUN apt-get update && apt-get -y install python3 python3-pip gradle zip unzip"
	>> Dockerfile echo "RUN pip3 install --upgrade requests google-cloud-pubsub google-cloud-storage"
	docker build -t bc20:basic .
	rm Dockerfile

# Compilation server
compile: basic
	>  Dockerfile echo "FROM bc20:basic"
	>> Dockerfile echo "CMD ./app/compile_server.py"
	docker build -t bc20:compile .
	rm Dockerfile

# Game runner server
game: basic
	>  Dockerfile echo "FROM bc20:basic"
	>> Dockerfile echo "CMD ./app/game_server.py"
	docker build -t bc20:game .
	rm Dockerfile

tarballs: compile game
	docker save bc20:compile > bc20_compile.tar
	docker save bc20:game > bc20_game.tar

clean:
	rm -f Dockerfile bc20_compile.tar bc20_game.tar
	docker rmi -f bc20:basic bc20:compile bc20:game

.PHONY: all basic compile game tarballs clean
