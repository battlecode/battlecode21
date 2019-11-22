.PHONY: basic compile game push clean

# Basic Dockerfile configuration
basic:
	docker build -t bc20-basic .

# Compilation server
compile: basic
	docker build -f compile.Dockerfile -t bc20-compile .

# Game runner server
game: basic
	docker build -f game.Dockerfile -t bc20-game .

# Push to google container registry
push: compile game
	docker tag bc20-compile gcr.io/battlecode18/bc20-compile
	docker tag bc20-game    gcr.io/battlecode18/bc20-game
	docker push gcr.io/battlecode18/bc20-compile
	docker push gcr.io/battlecode18/bc20-game

clean:
	docker rmi -f bc20-basic bc20-compile bc20-game gcr.io/battlecode18/bc20-compile gcr.io/battlecode18/bc20-game
