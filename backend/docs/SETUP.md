# Extra Setup Notes

## Local Development First-Time Setup

### Virtual Environment

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

### Database

Any time you start the backend, there must be a Postgres instance up. It's easiest to create a Postgres database running somewhere else (for example, on Google Cloud, or another deployment service), and then to provide connection info in `dev_settings.py` (and `dev_settings_sensitive.py`). (More instructions about setting up this database coming soon, in the "Database Setup" section! If they aren't here yet, bug Nathan.)

Next, run the following to initialize the database:

```python3
python manage.py migrate
```

(This will automatically create a new league with league ID 0. This is something we might want to change in the future, if we decide to make use of the multiple leagues.)

### Migrations

Anytime models are changed, run the following to actually make changes to the database itself:

```python3
python manage.py makemigrations
python manage.py migrate
```

(Note that if run through Docker or docker-compose, migrations are created and applied during the Docker process.)

## Database Setup

In the Google Cloud project, navigate to the SQL page.
Click on the most recently used database (eg for battlecode21, this is "bh20-db").
Click clone, give it a good name ("bc21-db", etc, works well), and choose "clone current state of instance".

Once the database is finished being created, connect to it with your Postgres editor of choice. The host will be the public IP address of the database (you can get this on Google Cloud); the port is 5432, the username and database are both "battlecode"; the password will be the same as the password of the old database you had cloned.

Delete the contents of the following tables. (_Don't delete the tables themselves!_ To easily delete info, you can run a query, such as `DELETE FROM [table_name]`.) The tables are: `api_scrimmage`, `api_scrimmage_hidden`, `api_submission`, `api_team`, `api_team_users`, `api_teamsubmission`, `api_tournament`, `api_tournamentscrimmage`, `api_update`, `api_user`, `django_admin_log`.
(You may have to delete them in a particular order. Particularly, if you get an error pertaining to a "foreign key constraint", you'll have to delete the table which uses it first. Deleting those tables is probably okay.)

Updating `api_league` is slightly different. Don't delete the entry; just edit it instead. Change `name` to something more suitable (eg `bh20`), change the `start_date` and `end_date` (they don't have to be exact, so feel free to use a longer range than the actual tournament. Set `active` to true. **Set `submissions_enabled` to false and `game_released` to false.** Finally `engine_version` needs to be changed as well; ask the infrastructure team what to change it to.

Next, we need to register a superuser account (for use by the infra). Run the battlecode website, and simply follow the normal account registration process. Take note of the password!
Also, have this superuser create and join a team (this is necessary for some permissions).
Then, go back to your Postgres editor. In `api_user`, find the user you just created. Change `is_superuser` and `is_staff` to true. Finally, pass the username and password of this account to the infrastructure team.

Then stop the old database (on its main page, press "stop").
