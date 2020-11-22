# Infrastructure and docker setup

## Overview
This folder contains code for four types of servers:
- The compile servers
- The game servers
- The scrimmage servers
- The tournament servers

Compile and game servers basically read from a google-managed queue; they get
a list of either source code that needs compiling, or scheduled matches that
need running. They'll claim a task, run it, update the database accordingly,
and then remove that task from the queue. These servers can be found in
`worker > app`. Their behavior is partially specified by values in `config.py`
(stores urls and aquires system variables) and `util.py` (contains functions
for interacting with the gcloud pub-sub and getting access tokens from backend)

Scrimmage and Tournament servers schedule matches. They can be found in `matcher`.
The scrimmage server will pull games from the backend and shift them onto the gcloud
pubsub (I am unsure whether this is necessary or if backend does this themselves).
The tournament server is more annoying and in need of some retrofits; It pushes all the
required games for the tournament to the scrimmage pub-sub, waits for results, pushes the
next batch, etc. etc. until the tournament has been completed. Results are returned
in a json file (bad).


## Configurations in Google Cloud

In GCloud > PubSub:
- Create new topic. Call it `bc20-compile`.
- Create new subscriber. Call it `bc20-compile-sub`. All compile servers will share this subscriber
- Repeat the above, with `bc20-game` and `bc20-game-sub`.
- Ensure retention time for both subscribers is sufficiently high.

In GCloud > IAM > Service accounts:
- Create new service account.
- Add roles: PubSub publisher, PubSub subscriber.
- Download JSON key; call it `worker/app/gcloud-key.json`.

In GCloud > Storage:
- Create new bucket. Call it `bc20-submissions`.
- Grant permissions to the service account: Storage Legacy Bucket Writer, Storage Object Viewer.

In GCloud > Compute Engine > Instance templates:
- Create new instance template.
- Check "Deploy a container image to this VM instance". This enables docker images to be deployed.

## How to use

- For a docker shell to do debugging in, run the following.
  ```
  make worker
  docker run -it bc20-worker
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
  export GOOGLE_APPLICATION_CREDENTIALS=worker/app/gcloud-key.json
  ./pub.py battlecode18 bc20-compile
  ```
- To run docker images on the gcloud servers:
  push the images to the container registry (see above)
  Set up instance templates in gcloud:
  - Navigate to `Compute Engine > Instance Templates`
  - Hit Create Instance Template
  - Check `deploy a container image to this VM instance`
  - Type in the name of the image, e.g. `gcr.io/uhhh im not quite sure we'll figure it out`
  Spin up the instance
  - Go to `Compute Engine > VM Instances`
  - Hit 'Create Instance'
  - Hit 'from Template' on the left
  - Select the template you made
  Good Job

## Tournaments

Here is a brief outline on how to run a tournament.
- Determine seeds in some reasonable way.
  Then, create two files, `team_names` and `team_pk`, containing the names and primary keys of all teams,
  in decreasing order of seed.
- Determine maps to use in each round, and create a JSON specifying this in a file `maps.json`.
  An example of this is in `data/0-example/maps.json`; the round names **must** agree with the round names produced by `bracketlib.py`.
- Check the tournament ID and update the Dockerfile command-line argument to match.
- Deploy a single docker instance from the tournament Dockerfile.
- When the match concludes, a list of replays will be output; feed this into `match_list.py` for human-readable data.
