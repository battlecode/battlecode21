# Infrastructure and docker setup

## Configurations in Google Cloud

In GCloud > PubSub:
- Create new topic. Call it `bc20-compile`.
- Create new subscriber. Call it `bc20-compile-sub`. All compile servers will share this subscriber
- Repeat the above, with `bc20-game` and `bc20-game-sub`.

In GCloud > IAM > Service accounts:
- Create new service account.
- Add roles: PubSub publisher, PubSub subscriber.
- Download JSON key; call it `app/gcloud-key.json`.

In GCloud > Storage:
- Create new bucket. Call it `bc20-submissions`.
- Grant permissions to the service account: Storage Legacy Bucket Writer, Storage Object Viewer.

In GCloud > Compute Engine > Instance templates:
- Create new instance template.
- Check "Deploy a container image to this VM instance". This enables docker images to be deployed.

## How to use

- For a docker shell to do debugging in, run the following,
  where `X` is either `worker` or `matcher`:
  ```
  make X
  docker run -it bc20-X
  ```
- For an actual server, run the following,
  where X is one of `compile`, `game`, `scrimmage` or `tournament`:
  ```
  make X
  docker run -d bc20-X
  ```
- To push docker images to the container registry:
  ```
  gcloud auth configure-docker # Only needs to be run once to configure settings
  make push
  ```
- To publish a `helloworld` message to the Pub/Sub, obtain the private key, and then:
  ```
  export GOOGLE_APPLICATION_CREDENTIALS=app/gcloud-key.json
  ./pub.py battlecode18 bc20-compile
  ```
