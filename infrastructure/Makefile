.PHONY: env worker compile game scrimmage tournament images push clean

# Basic environment variables for docker images
env:
	docker build - < env.Dockerfile -t bc20-env

# Worker servers: compilation server and game runner server
worker: env
	docker build -f worker.Dockerfile -t bc20-worker worker
compile: worker
	docker build -f compile.Dockerfile -t bc20-compile worker
game: worker
	docker build -f game.Dockerfile -t bc20-game worker

# Matchmaking servers: scrimmage matchmaking and tournament running
scrimmage: env
	docker build -f scrimmage.Dockerfile -t bc20-scrimmage matcher
tournament: env
	docker build -f tournament.Dockerfile -t bc20-tournament matcher

images: compile game scrimmage tournament

# Push to google container registry
push: images
	docker tag bc21-compile    gcr.io/battlecode18/bc20-compile
	docker tag bc21-game       gcr.io/battlecode18/bc20-game
	docker tag bc21-scrimmage  gcr.io/battlecode18/bc20-scrimmage
	docker tag bc21-tournament gcr.io/battlecode18/bc20-tournament
	docker push gcr.io/battlecode18/bc21-compile
	docker push gcr.io/battlecode18/bc21-game
	docker push gcr.io/battlecode18/bc21-scrimmage
	docker push gcr.io/battlecode18/bc21-tournament

clean:
	docker rmi -f bc21-env bc21-worker bc21-compile bc21-game bc21-scrimmage bc21-tournament
	docker rmi -f gcr.io/battlecode18/bc21-compile gcr.io/battlecode18/bc21-game gcr.io/battlecode18/bc21-scrimmage gcr.io/battlecode18/bc21-tournament
