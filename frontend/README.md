# Battlecode Frontend

Fully static frontend in React, based on `battlecode19/app`, using modified template from http://creative-tim.com. 

![](screenshot.png)

## Local Development

It's easiest to run the frontend through Node. To do so, follow the instructions in the rest of this section.

(Alternatively, you could run the frontend through Docker: run `docker-compose up --build frontend` from the repo's root directory.)

### First-Time Setup

First, make sure you have [Node](https://nodejs.org/en/download/) installed. (Also, on Windows, [Cygwin](https://www.cygwin.com/) is recommended to use as your terminal environment.) Then, in this directory, run:

```
npm install
```

### Running

Make sure that the backend in `../backend` is running at `localhost:8000`.

In this directory, run:

```
npm run start
```

This automatically reloads the page on changes. To run the same thing without automatically opening a browser, run `npm run startx`, and then navigate to http://localhost:3000.

### Notes

When installing a new Node package, always `npm install --save <package>` or `npm install --save-dev <package>`, and commit `package.json` and `package-lock.json`. This should work even if we run it from Docker. If you don't have `npm` installed on your computer, you can `docker exec -it battlecode20_frontend_1 sh` and then run the commands above.

Our local processes (including our dockerfile) use `npm start` and/or `npm run start`. These commands automatically use `.env.development`, and not `.env.production`. See here for more information: https://create-react-app.dev/docs/adding-custom-environment-variables/#what-other-env-files-can-be-used

## Deployment

For production, build with `npm run build` for the full thing, and `npm run buildnogame` to build the site without any game specific information. This is handled automatically by calling `./deploy.sh deploy` or `./deploy.sh deploynogame` using Bash, respectively. Note that the former should ONLY be called after the release of the game, since it makes the game specs and the visualizer public.

### access.txt

During deployment, you'll need an up-to-date version of `frontend/public/access.txt`. This file is needed by game runners to run matches, and by competitors because it grants them access to downloading the GitHub package containing the engine. It's is really difficult to deploy; our solution is to have it deployed with the rest of the frontend code and onto our website, but have it never pushed to GitHub. Make sure you have an up-to-date copy! If you don't have one, check with the infra devs.

### Assorted notes

Notably, the servers that serve the deployed frontend never run npm (through Docker or otherwise). Instead, our deploy script runs npm locally to build the frontend, and then sends this compiled version to Google Cloud.

Deployed code automatically builds using `.env.production`, since we call it with `npm run build`. See here for more information: https://create-react-app.dev/docs/adding-custom-environment-variables/#what-other-env-files-can-be-used

### One-time setup

#### AWS

We first need to register the subdomain.

1. Go to [Route 53 on AWS](https://console.aws.amazon.com/route53/home?region=us-east-1#).
2. Go to the [battlecode.org hosted zone](https://console.aws.amazon.com/route53/v2/hostedzones#ListRecordSets/Z2GXL51TK1J2YK).
3. Click `Create record` (big orange button), then Simple routing > Define simple record.
4. Type in the subdomain name (e.g. `2021`), route traffic to the IP address 35.186.192.112 (or whatever the Google Cloud load balancer's IP address is). Leave the record type as A, and the TTL can be whatever.

This should create the subdomain `2021.battlecode.org` and point it to our load balancer.

With this new subdomain registered, make sure to update the URLs in `.env.production`to this new URL.

#### Google Cloud

We now need to set up a new bucket, and set up the load balancer to point to the bucket when navigating to the right address.

1. In the Google Cloud web console, go to [Storage > Storage > Browser](https://console.cloud.google.com/storage/browser?project=battlecode18&prefix=).
2. Click `Create bucket`.
3. Name it something like `battlecode21-frontend`.
4. Leave most options at the default setting, but change the access control to "Uniform" from "Fine-grained".
5. Create the bucket.
6. Go to the "Permissions" section in the newly created bucket. Click "Add user" and type in `allUsers` with the role "Storage Object Viewer".
7. Download the `gcloud` command line tool if you haven't done so yet, sign into your account and choose the battlecode account, and run `gsutil web set -m index.html -e index.html gs://battlecode21-frontend` from your terminal. This will make all pages, including error pages, point to the single page React app that we have.

This sets up the bucket. Finally, we need to set up the load balancer to point to the bucket:

1. In the Google Cloud web console, go to [Network > Network services > Load balancing](https://console.cloud.google.com/net-services/loadbalancing/loadBalancers/list?project=battlecode18).
2. Go to the `web-map` load balancer.
3. Click "Edit".
4. Under "Backend configuration", add the newly created bucket.
5. Under "Host and path rules", add the rule with host `2021.battlecode.org`, path `/*` and backend the newly created bucket.
6. Under "Frontend configuration", open up the HTTPS configuration, click the "Certificate" drop-down, and click "Create a new certificate". Name it something, select "Create Google-managed certificate" and enter all domains (which should be all domains previously in use, e.g. `battlecode.org`, `2020.battlecode.org`, etc, plus the new domain you just added, e.g. `2021.battlecode.org`).
7. Under "Review and finalize", make sure everything looks good.
8. Click "Update".
9. Wait for like 10 minutes!

Now, you should be able to follow the deployment instructions above (`npm run build` and `./deploy.sh deploy`) to deploy the website and see it live on your new subdomain!
