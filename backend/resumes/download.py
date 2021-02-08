import os, csv
from google.oauth2 import service_account
from google.cloud import storage
FILE_PATH = os.path.dirname(__file__)
os.sys.path.append(os.path.join(FILE_PATH, '..'))
from dev_settings_real import GOOGLE_APPLICATION_CREDENTIALS

# constants, please configure
GCLOUD_BUCKET_RESUMES = 'bc20-resumes'
BUCKET_MIN = 1600
BUCKET_MAX = 5000
USERS_ALL_PATH = os.path.join(FILE_PATH, 'users_all.csv')
USERS_TEAMS_PATH = os.path.join(FILE_PATH, 'users_teams.csv')

# load up the sql query results, as list of dictionaries
users_all = []
users_all_header = []
with open(USERS_ALL_PATH, 'r') as csvfile:
    reader = csv.reader(csvfile)
    users_all_header = next(reader)
    for row in reader:
        row_dict = dict()
        for i in range (0, len(row)):
            key = users_all_header[i]
            row_dict[key] = row[i]
        users_all.append(row_dict)

users_teams = []
users_teams_header = []
with open(USERS_TEAMS_PATH, 'r') as csvfile:
    reader = csv.reader(csvfile)
    users_teams_header = next(reader)
    for row in reader:
        row_dict = dict()
        for i in range (0, len(row)):
            key = users_teams_header[i]
            if key in ["high_school", "international", "student"]:
                # we want booleans for these
                row_dict[key] = bool(row[i])
            else:
                row_dict[key] = row[i]
        users_teams.append(row_dict)

# initialize google bucket things
with open('gcloud-key.json', 'w') as outfile:
    outfile.write(GOOGLE_APPLICATION_CREDENTIALS)
    outfile.close()
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(os.path.join(FILE_PATH, 'gcloud-key.json'))
client = storage.client.Client()
os.remove('gcloud-key.json') # important!!!
bucket = client.get_bucket(GCLOUD_BUCKET_RESUMES)

# initialize file paths for downloads
def safe_makedirs(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)
files_dir = os.path.join(FILE_PATH, 'files')
safe_makedirs(files_dir)
hs_us_dir = os.path.join(files_dir, 'hs-us')
safe_makedirs(hs_us_dir)
hs_intl_dir = os.path.join(files_dir, 'hs-intl')
safe_makedirs(hs_intl_dir)
col_us_dir = os.path.join(files_dir, 'col-us')
safe_makedirs(col_us_dir)
col_intl_dir = os.path.join(files_dir, 'col-intl')
safe_makedirs(col_intl_dir)
other_dir = os.path.join(files_dir, 'other')
safe_makedirs(other_dir)
os.chmod(files_dir, 0o777)

# download helper!
def download(user_id, file_name, bucket, files_dir):
    try:
        blob = bucket.get_blob(os.path.join(str(user_id), 'resume.pdf'))
        with open(os.path.join(files_dir, file_name), 'wb+') as file_obj:
            blob.download_to_file(file_obj)
            file_obj.close()
    except PermissionError:
        print("Could not obtain permissions to save; try running as sudo")
    except Exception as e:
        print("Could not retrieve source file from bucket, user id", user_id)
        print("Exception:", e)

# actually download resumes, first from users_teams
def download_user(user, bucket, files_dir):
    if 'student' in user: # user comes from users_teams
        if user['student']:
            if user['high_school']:
                if user['international']:
                    subfolder = 'hs-intl'
                else: #domestic 
                    subfolder = 'hs-us'
            else: # college
                if user['international']:
                    subfolder = 'col-intl'
                else:
                    subfolder = 'col-us'
        else:
            subfolder = 'other'
    else: # user comes from users_all
        subfolder = 'other'
    user_id = user["id"]
    # file name: "0ELO-FirstLast" (elo left padded, min 0)
    if "student" in user:
        elo_int = int(float(user['score']))
        elo_str_padded = str(max(0, elo_int)).zfill(4)
        short_file_name = elo_str_padded + "-" + user["first_name"] + user["last_name"]
    else:
        short_file_name = user["first_name"] + user["last_name"]
    full_file_name = subfolder + '/' + short_file_name +'.pdf'

    # TODO check if file exists already
    # if exists, note that we're skipping it
    download(user_id, full_file_name, bucket, files_dir)

ids_users_downloaded = set()
for user in users_teams:
    download_user(user, bucket, files_dir)
    ids_users_downloaded.add(user["id"])
for user in users_all:
    if user["id"] not in ids_users_downloaded:
        download_user(user, bucket, files_dir)
        ids_users_downloaded.add(user["id"])
