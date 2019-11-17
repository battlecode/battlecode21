.PHONY: basic compile game push clean

# Basic Dockerfile configuration
basic:
	>  Dockerfile echo "FROM ubuntu:18.04"
	>> Dockerfile echo "COPY servers/app /app"
	>> Dockerfile echo "COPY servers/box /box"
	>> Dockerfile echo "ENV GOOGLE_APPLICATION_CREDENTIALS /app/gcloud-key.json"
	>> Dockerfile echo "RUN apt-get update && apt-get -y install python3 python3-pip openjdk-8-jdk git zip"
	>> Dockerfile echo "RUN pip3 install --upgrade requests google-cloud-pubsub google-cloud-storage"
	>> Dockerfile echo "WORKDIR box"
	>> Dockerfile echo "RUN ./pull_setup.sh"
	>> Dockerfile echo "WORKDIR /"
	docker build -t bc20-basic .
	rm Dockerfile

# Compilation server
compile: basic
	>  Dockerfile echo "FROM bc20-basic"
	>> Dockerfile echo "CMD ./app/compile_server.py"
	docker build -t bc20-compile .
	rm Dockerfile

# Game runner server
game: basic
	>  Dockerfile echo "FROM bc20-basic"
	>> Dockerfile echo "CMD ./app/game_server.py"
	docker build -t bc20-game .
	rm Dockerfile

push: compile game
	docker tag bc20-compile gcr.io/battlecode18/bc20-compile
	docker tag bc20-game    gcr.io/battlecode18/bc20-game
	docker push gcr.io/battlecode18/bc20-compile
	docker push gcr.io/battlecode18/bc20-game

clean:
	rm -f Dockerfile
	docker rmi -f bc20-basic bc20-compile bc20-game gcr.io/battlecode18/bc20-compile gcr.io/battlecode18/bc20-game
