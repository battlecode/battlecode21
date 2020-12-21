# Battlecode Backend API

Written in Django Rest Framework. Based on `battlecode19/api`.

## Local Development

The best way to run the backend locally is to run `docker-compose up --build backend` from the repo's root directory.

If you don't have Docker, or want to run Django outside of Docker, follow the instructions in the rest of this section.

For a nice interface to test the backend, go to `localhost:8000/docs/`.

### First-Time Setup

The process of using a virtual environment uses a lot of one-time steps. See the `docs/SETUP.md` file for more.

### Running

Make sure you work in your virtual environment. Also, if `requirements.txt` has been changed, make sure all packages are up to date; and, if models are changed, make sure to migrate. (Instructions can be found in the file referenced above.)

Then, set the necessary environment variables (only needed once per terminal session):

```python3
export DJANGO_SETTINGS_MODULE="dev_settings"
```

Then, start the server:

```python3
python manage.py runserver
```

The backend should now be running on `localhost:8000`. You can open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser to verify that it works.

If you've installed uWSGI, you can utilize it (which is what is used in production) by running `uwsgi --ini uwsgi-dev.ini`. Note that the backend may be running on port 80, instead of 8000. You should check this, and then change URLs in `frontend/.env.development` as necessary.

When you're done, make sure to leave your venv:

```python3
deactivate
```

### Testing

`coverage run --source='.' manage.py test`
`coverage report`

To use the Python debugger: `from nose.tools import set_trace; set_trace()` (Note that Nose breaks the regular pdb.)

### Installing Packages

Django 2.0.3 and Webpack 4.0.1 are both very recently released. You may run into backwards compatibility issues with 3rd party packages, or deprecated functions. Try to refer to the most up-to-date documentation when possible. You may also run into problems if i.e. you have different version node modules installed globally instead of locally.

When installing a new Python package:
`pip install <package>`
`pip freeze > requirements.txt`

Always commit the most recent `requirements.txt`.

## Deployment

Note that the deployed version of the backend uses regular `docker` and this folder's `Dockerfile` to build. In particular, `docker-compose.yml` is not used by the deployment process at all.

Also, note that the deployed version uses `uWSGI` to run (as specified in the Dockerfile), and serves out of port 80, as opposed to Django's own serving and port 8000.

### First-Time Deployment Setup

A database should be created.

Also, a backend should be created.

We currently have continuous builds triggered by pushes to master. Therefore, make sure that everything is actually working before pushing. Also, make sure that any new database migrations are also applied to the production server before deploying. A good way to ensure this is to always test locally with the production database, before committing and pushing to master.

The images are then deployed as an instance group on GCE. To update the instances to use the newly built image, perform a rolling update of the instance group.

Pls pls use SHA256 digests in the `Dockerfile`. Otherwise, the image might be rebuilt, from the same commit tag as before, but not working anymore (this happened, and it was not fun).

Ideally, we would like to move to Kubernetes for everything, as that would make everything much easier, but it doesn't currently support having a load balancer that also points to storage buckets. This is a deal-breaker, since the frontend is static.

### Deploying

1. Push to master.
2. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers?project=battlecode18) on Google Cloud.
3. Click "Run trigger" under the `battlecode/battlecode20` trigger.
4. Go to [Cloud Build History](https://console.cloud.google.com/cloud-build/builds?project=battlecode18). You should see a spinning blue icon next to a recently started build, which should reference the most recent commit ID on master on this repo. Wait until the spinning icon turns into a green checkmark (this usually takes 2-3 minutes).
5. Go to the [battlecode20-backend-true](https://console.cloud.google.com/compute/instanceGroups/details/us-east1-b/battlecode20-backend-true?project=battlecode18) instance group in the Compute Engine. Press `Rolling Restart/Replace`.
6. Change operation from `Restart` to `Replace`. Let maximum surge be 1 and **maximum unavailable be 0** (we don't want our server to go down).
7. Wait until all spinning blue icons have turned into green checkmarks (this takes like 10 minutes I think).

This procedure is currently very long and requires too much manual intervention. We should write a script that does all of this for us (which shouldn't be too hard).
