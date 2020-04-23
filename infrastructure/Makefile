.PHONY: env worker compile game scrimmage tournament images push clean

# Basic environment variables for docker images
env:
	docker build - < env.Dockerfile -t bh20-env

# Worker servers: compilation server and game runner server
worker: env
	docker build -f worker.Dockerfile -t bh20-worker worker
compile: worker
	docker build -f compile.Dockerfile -t bh20-compile worker
game: worker
	docker build -f game.Dockerfile -t bh20-game worker

# Matchmaking servers: scrimmage matchmaking and tournament running
scrimmage: env
	docker build -f scrimmage.Dockerfile -t bh20-scrimmage matcher
tournament: env
	docker build -f tournament.Dockerfile -t bh20-tournament matcher

images: compile game #scrimmage tournament

# Push to google container registry
push: images
	docker tag bh20-compile    gcr.io/battlecode18/bh20-compile
	docker tag bh20-game       gcr.io/battlecode18/bh20-game
	# docker tag bh20-scrimmage  gcr.io/battlecode18/bh20-scrimmage
	# docker tag bh20-tournament gcr.io/battlecode18/bh20-tournament
	docker push gcr.io/battlecode18/bh20-compile
	docker push gcr.io/battlecode18/bh20-game
	# docker push gcr.io/battlecode18/bh20-scrimmage
	# docker push gcr.io/battlecode18/bh20-tournament

clean:
	docker rmi -f bh20-env bh20-worker bh20-compile bh20-game bh20-scrimmage bh20-tournament
	docker rmi -f gcr.io/battlecode18/bh20-compile gcr.io/battlecode18/bh20-game gcr.io/battlecode18/bh20-scrimmage gcr.io/battlecode18/bh20-tournament
