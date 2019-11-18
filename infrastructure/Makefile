.PHONY: basic compile game push clean

# Basic Dockerfile configuration
basic:
	docker build -t bc20-basic .

# Compilation server
compile: basic
	>  compile.dockerfile echo "FROM bc20-basic"
	>> compile.dockerfile echo "CMD ./app/compile_server.py"
	docker build -f compile.dockerfile -t bc20-compile .
	rm compile.dockerfile

# Game runner server
game: basic
	>  game.dockerfile echo "FROM bc20-basic"
	>> game.dockerfile echo "CMD ./app/game_server.py"
	docker build -f game.dockerfile -t bc20-game .
	rm game.dockerfile

push: compile game
	docker tag bc20-compile gcr.io/battlecode18/bc20-compile
	docker tag bc20-game    gcr.io/battlecode18/bc20-game
	docker push gcr.io/battlecode18/bc20-compile
	docker push gcr.io/battlecode18/bc20-game

clean:
	docker rmi -f bc20-basic bc20-compile bc20-game gcr.io/battlecode18/bc20-compile gcr.io/battlecode18/bc20-game
