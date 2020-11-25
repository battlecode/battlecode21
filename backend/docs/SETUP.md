## Locally running through venv 
### First-Time Setup

#### Virtual Environment

Open a terminal, and `cd` into this directory. Create a virtual environment by following the instructions below.

- `pip3 install virtualenv` (or `pip` if your default Python installation is 3)
- `virtualenv venv -p python3`
- `source venv/bin/activate` (or if this doesn't work, perhaps `source venv/Scripts/activate`, or `source env/bin/activate`; basically, just try to find an activate file)
- `pip install -r requirements.txt` (`pip3` is not necessary since the default Python version within the virtualenv is 3)

A couple errors may occur when installing the requirements:

- Sometimes psycopg2 fails to compile since it needs some prerequisites. You can follow the installation process [see here](https://www.psycopg.org/docs/install.html#install-from-source). 
  - Alternatively, you can use `psycopg2-binary`. Comment out the `psycopg2` line in requirements.txt, run `pip install psycopg2-binary`, then `pip install -r requirements.txt`, then uncomment that line. (It's better that we use `psycopg2`, rather than the binaries, in production. So, make sure to _not commit any changes_.)
  - Another potential fix: On Mac, [this StackOverflow answer has a solution](https://stackoverflow.com/a/39800677/3767728) (command should be `env LDFLAGS="-I/usr/local/opt/openssl/include -L/usr/local/opt/openssl/lib" pip install psycopg2==2.8.3 --upgrade`) (if you still have problems with psycopg2 on mac after this, try `brew reinstall openssl` and `brew install postgresql`)
- uWSGI may fail to build. This is fine, as you don't actually need it to develop locally. Comment it out, run `pip install -r requirements.txt`, and then uncomment it (again so that we can use it in production -- make sure to _not commit any changes_).

#### Database

Any time you start the backend, there must be a Postgres instance up. It's easiest to create a Postgres database running somewhere else (for example, on Google Cloud, or another deployment service), and then to provide connection info in `dev_settings.py` (and `dev_settings_sensitive.py`). (More instructions about setting up this database coming soon! If they aren't here yet, bug Nathan.)

Next, run the following to initialize the database:

```python3
python manage.py migrate
```

(This will automatically create a new league with league ID 0. This is something we might want to change in the future, if we decide to make use of the multiple leagues.)

#### Migrations

Anytime models are changed, run the following to actually make changes to the database itself:

```python3
python manage.py makemigrations
python manage.py migrate
```

(Note that if run through Docker or docker-compose, migrations are created and applied during the Docker process.)