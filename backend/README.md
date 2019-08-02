# Battlecode Backend API

Written in Django Rest Framework. Based on `battlecode19/api`.

## Local Development

### First-Time Setup

Create a virtual environment. This keeps all dependencies consistent. Follow the instructions below.

- `pip3 install virtualenv` (or `pip` if your default Python installation is 3)
- `virtualenv venv -p python3`
- `source venv/bin/activate`
- `pip install -r requirements.txt` (`pip3` is not necessary since default Python within the virtualenv is 3)

Any time you start the backend, there must also be a Postgres instance up on `localhost:5432` (or whatever credentials are used in `battlecode/dev_settings.py`) with a database named `battlecode`. You must make migrations and migrate the first time you start the website, or whenever you change the models. It is easy to run Postgres in [Docker](https://docs.docker.com/install/):

`docker run -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=battlecode --name bc20db -d postgres`

To stop or start the container: `docker stop bc20db` `docker start bc20db`

To manage the database on a Mac, Postico is a good tool.

### Commands

Always work in your virtual environment.

`source venv/bin/activate`

Install requirements using
`pip install -r requirements.txt`

Then start the backend:

`export DJANGO_SETTINGS_MODULE="dev_settings"`
`export EMAIL_PASS="passwordtobattlecodegmail"`
`python manage.py makemigrations`
`python manage.py migrate`
`python manage.py runserver`

(The `passwordtobattlecodegmail` should be replaced by the real password.)

Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.

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
