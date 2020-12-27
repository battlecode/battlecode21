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

Updating `api_league` is slightly different. Don't delete the entry; just edit it instead. Change `name` to something more suitable (eg `bh20`), change the `start_date` and `end_date` (they don't have to be exact, so feel free to use a longer range than the actual tournament. **Set `active` to true. Set `submissions_enabled` to true. Set `game_released` to false.** Finally `engine_version` needs to be changed as well; ask the infrastructure team what to change it to.

Next, we need to register a superuser account (for use by the infra). Run the battlecode website, and simply follow the normal account registration process. Take note of the password!
Also, have this superuser create and join a team (this is necessary for some permissions).
Then, go back to your Postgres editor. In `api_user`, find the user you just created. Change `is_superuser` and `is_staff` to true. Finally, pass the username and password of this account to the infrastructure team.

Then stop the old database (on its main page, press "stop").

## Deployment Setup

Deployment is done through the Google Cloud Platform. You'll need access to the Google Cloud project. (If you don't have access already, ask a dev to add you.) It's also helpful to install gsutil, a command line application for managing GCP. Link here: https://cloud.google.com/storage/docs/gsutil.

With that, you can start here --

### Storage Buckets
Go to "Storage" on GCP console. A bucket for submissions should have been created (if not, instructions are in the infrastructure readme.)
Set up the CORS policy, which allows us to upload to the bucket on external websites. Find `docs/cors,json`; in there, update the domain URLs listed. Then, run `gsutil cors set path/to/cors.json gs://bc21-submissions` (updating the bucket name) to whatever it is this year.
More info is here: https://cloud.google.com/storage/docs/configuring-cors#gsutil

### Cloud Build Triggers
Go to "Cloud Build" triggers on GCP console, here: https://console.cloud.google.com/cloud-build/triggers?project=battlecode18
Click "Connect new repository". Select source as "GitHub (Cloud Build GitHub App)", and after authenticating (if necessary), select the repository of the new project, and click on the confirmation message checkbox, too. Finally, create a default push trigger for now.
Return to the triggers page, and click on the trigger you just made. Rename it (e.g. "bh21-push-trigger"). Also, change "source" to `^master$`. (This causes the trigger only to occur on pushes to master; feel free to change the regex as needed.) For build configuration, pick "Dockerfile".
Change Dockerfile directory to `/backend`, and image name to `gcr.io/battlecode18/github.com/battlecode/battlecode21:latest`, replacing `battlecode21` with whatever the name of this repo is. (It might be possible to use `$REPO_NAME` but this hasn't been tested yet.)

With this step done: on pushes to master, Google Cloud will create a Docker container with our latest code. Push a commit to master, to test that the trigger works! Under "Cloud Builds" -> "History" you can see the build in progress.

### Instance Template
From Google Cloud console, "Compute Engine" -> “Instance Templates”. Click on an old backend template, and then click on “Create similar”. Change the name to something descriptive enough and conventional. ("bc21-backend-template", for example, works well. Also I’ve found that including the current date and time in the name can help keep things straight.) For machine type, we've found the `n1-standard-n1` to be cheap and work well, especially providing enough memory.

Check the checkbox of "Deploy a container image to this VM instance", and change the container image to the image name you've just written in the cloud build trigger. 
Then, click "Advanced container options" to see a place to set environment variables. In the repo's `backend/settings.py`, you can look at the `os.getenv` calls to see which environment variables are needed. Set these here, to the same values that have been used in local testing / in `dev_settings_sensitive.py`. (Other than `DB_HOST`, these probably don't need changing.) Note that these are un-editable; if you ever change environment variables, you'll have to make a new instance template.

(For now, keep the boot disk the same; it may be good to change it to a later version down the road. Be sure to test that the VMs still work, though.)

Finally, in the "Firewall" section's checkboxes, allow both HTTP and HTTPS traffic. (Not sure how necessary this is but it seems good.)

### Instance Group
Now go to "Compute Engine" -> "Instance groups". Click "create instance group".
For name, again just do something nice that follows a convention, as before.
Click on "specify port name mapping", and then add two items: port name "http" and port number "80", and port name "https" and port number "80" as well. (since at least for now, the backend takes in requests through port 80)
Set the "instance template" to the instance template you've just created.
Under "autohealing", select a health check. I think the k8s check works best, but feel free to play around with this.
Finally click create!

### VM Instance
(You can manage individual VM instances, both within an instance group and on their own. For example, from here, you can check logs that and individual VM produces. There's nothing necessary here for the deployment process, though.)

### Load Balancer
In the Google Cloud web console, go to Network > Network services > Load balancing. Go to the web-map load balancer. Click "Edit".

Click on backend configuration. Under "Backend services", find "backend-backend-service", and click the "edit" icon. Under "backends", edit the present backend. In particular, when the menu expands, change the instance group to the new one you just created. Click "update" to save your progress.

You'll also need to create a few backend buckets. Go back to the web-map balancer, click edit. Under "Backend buckets", find "submissions-backend-bucket". Click on the edit icon, and change the "Cloud Storage bucket" to the new cloud storage bucket created for this competition. (Instructions about creating that cloud storage bucket are in infra.) Click "update" again.

Next, path and host rules have to be updated. You should have registered a new domain for this competition, eg "2021.battlecode.org". (If not, do so! Instructions are in the repo.) Update the host for all rules, so that the rules are using the new domain name. They should be roughly as follows:
![image](https://user-images.githubusercontent.com/14008996/102729000-8b7a7580-42e3-11eb-8356-fbb58f3501e7.png)
Finally, click update!

(Note: sometimes, after you try to update changes, they may not go through. This may be due to creating too many backend instances/buckets; we can only have so many up at any given time. You'll see notifications and any errors in the top right corner of the Google Console; you can check if this is the problem. If so, deleting old backend services/buckets is surprisingly hard. You need to first delete any uses of them in the host and path rules, then delete their uses in the "backend services" / "backend buckets" lists on the edit page's backend configuration section; don't forget to save. Then you need to _actually_ delete them, by using the gcloud command line interface. Instructions [here](https://cloud.google.com/sdk/gcloud/reference/compute/backend-services/delete) and [here](https://cloud.google.com/sdk/gcloud/reference/compute/backend-buckets/delete).)

### Some last steps
Delete old instance groups: go to "Compute Engine" -> "Instance groups", check any old instance groups that are no longer in use, and click "delete".
Delete old instance template: go to "Compute Engine" -> "Instance templates", check any old templates that are no longer in use, and click "delete".
Delete old, unused backend services and buckets, if you're up to it, instructions in previous section. But this can be a pain and is certainly not necessary.

<!-- TODO note about Google Application credentials: get the service account json from an infra dev. (Or, if they haven't made it, feel free to skip this step for now, but come back to it!!) Set it in dev_settings_sensitive.py (formatting is a little weird, -- it has to be enclosed in quotes ina  particular manner -- find an use old values of the json in dev_settings_sensitive.py as an example), and in the instance template (you can just copy paste it). 
End note -- make sure google app credentials are set in dev_settings_sensitive.py, and as an env in the template. submissions will be broken otherwise til then -->
