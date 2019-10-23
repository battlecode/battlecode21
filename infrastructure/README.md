# Infrastructure and docker setup

## Configurations in Google Cloud

In GCloud > PubSub:
- Create new topic. Call it `bc20-compile`.
- Create new subscriber. Call it `bc20-compile-sub`. All compile servers will share this subscriber
- Repeat the above, with `bc20-game` and `bc20-game-sub`.

In GCloud > IAM > Service accounts:
- Create new service account.
- Add roles: PubSub publisher, PubSub subscriber.
- Download JSON key; call it `pubsub/gcloud-key.json`.

In GCloud > Storage:
- Create new bucket. Call it `bc20-submissions`.
- Grant permissions to the service account: Storage Legacy Bucket Writer, Storage Object Viewer.

## How to use

For a docker shell to do debugging in:
```
make shell
docker run -d bc20_shell
```

For a compile server (the docker image is also written to a tarball in `bc20_compile.tar`)
```
make compile
docker run -d bc20_compile
```

For a game runner server (the docker image is also written to a tarball in `bc20_game.tar`)
```
make game
docker run -d bc20_game
```

To publish a `helloworld` message to the Pub/Sub, obtain the private key, and then:
```
export GOOGLE_APPLICATION_CREDENTIALS=pubsub/gcloud-key.json
./pub.py battlecode18 bc20-compile
```
