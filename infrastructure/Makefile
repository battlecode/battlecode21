.PHONY: worker compile game matcher scrimmage tournament images push clean

# Worker servers: compilation server and game runner server
worker:
	docker build -f worker.Dockerfile -t bc20-worker .
compile: worker
	docker build -f compile.Dockerfile -t bc20-compile .
game: worker
	docker build -f game.Dockerfile -t bc20-game .

# Matcher servers: scrimmage matchmaking and tournament running
matcher:
	docker build -f matcher.Dockerfile -t bc20-matcher .
scrimmage: matcher
	docker build -f scrimmage.Dockerfile -t bc20-scrimmage .
tournament: matcher
	docker build -f tournament.Dockerfile -t bc20-tournament .

images: compile game scrimmage tournament

# Push to google container registry
push: images
	docker tag bc20-compile    gcr.io/battlecode18/bc20-compile
	docker tag bc20-game       gcr.io/battlecode18/bc20-game
	docker tag bc20-scrimmage  gcr.io/battlecode18/bc20-scrimmage
	docker tag bc20-tournament gcr.io/battlecode18/bc20-tournament
	docker push gcr.io/battlecode18/bc20-compile
	docker push gcr.io/battlecode18/bc20-game
	docker push gcr.io/battlecode18/bc20-scrimmage
	docker push gcr.io/battlecode18/bc20-tournament

clean:
	docker rmi -f bc20-worker bc20-compile bc20-game bc20-matcher bc20-scrimmage bc20-tournament
	docker rmi -f gcr.io/battlecode18/bc20-compile gcr.io/battlecode18/bc20-game gcr.io/battlecode18/bc20-scrimmage gcr.io/battlecode18/bc20-tournament
