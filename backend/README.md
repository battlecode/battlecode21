# Battlecode Backend API

Written in Django Rest Framework. Based on `battlecode19/api`.

## Local Development

### First-Time Setup

#### Virtual Environment

Create a virtual environment by following the instructions below.

- `pip3 install virtualenv` (or `pip` if your default Python installation is 3)
- `virtualenv venv -p python3`
- `source venv/bin/activate`
- `pip install -r requirements.txt` (`pip3` is not necessary since the default Python version within the virtualenv is 3)

#### Database

Any time you start the backend, there must be a Postgres instance up on `localhost:5432` (or whatever credentials are used in `battlecode/dev_settings.py`) with a database named `battlecode`. You must make migrations and migrate the first time you start the website, or whenever you change the models. It is easy to run Postgres in [Docker](https://docs.docker.com/install/):

```
docker run -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=battlecode --name bc20db -d postgres
```

To stop or start the database container: `docker stop bc20db` `docker start bc20db`. [Postico](https://eggerapps.at/postico/) and [pgAdmin](https://www.pgadmin.org/) are two useful tools for managing the database.

#### Migrations

Run the following to set up the database:

```
python manage.py makemigrations
python manage.py migrate
```

Then, create a new league (which currently has to be done manually, for example in Postico), with id 0. We don't currently use multiple leagues.

### Running

Make sure you work in your virtual environment, make sure all packages are up to date, start the database, and set the necessary environment variables (only needed once per terminal session):

```
source venv/bin/activate
pip install -r requirements.txt
docker start bc20db
export DJANGO_SETTINGS_MODULE="dev_settings"
export EMAIL_PASS="passwordtobattlecodegmail"
```

Then, start the server:

```
python manage.py runserver
```

The backend should now be running on `localhost:8000`. You can open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser to verify that it works.

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
