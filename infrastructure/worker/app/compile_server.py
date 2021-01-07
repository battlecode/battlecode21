#!/usr/bin/env python3

# This server subscribes to the gcloud compiler pub-sub -- basically a queue of submissions
# that need compiling. It will do its best to accomplish this, and report success or failure
# to the pubsub and backend.

import subscription, util
from config import *

import sys, os, shutil, logging, requests
from google.cloud import storage


def compile_report_result(submissionid, result, reason=None):
    """Sends the result of the run to the API endpoint"""
    try:
        auth_token = util.get_api_auth_token()
        response = requests.patch(
            url=api_compile_update(submissionid), # https://2021.battlecode.org/api/0/submission/0/compilation_update/
            data={  'compilation_status': result #, 'reason': reason
            },
            headers={'Authorization': 'Bearer {}'.format(auth_token)}
        )
        response.raise_for_status()
    except Exception as e:
        logging.critical('Could not report result to API endpoint', exc_info=e)
        sys.exit(1)

def compile_log_error(submissionid, reason):
    """Reports a server-side error to the backend and terminates with failure"""
    logging.error(reason)
    compile_report_result(submissionid, COMPILE_ERROR, reason=reason)
    sys.exit(1)

def compile_log_fail(submissionid, reason):
    """Reports a compilation failure to the backend"""
    logging.error(reason)
    compile_report_result(submissionid, COMPILE_FAIL, reason=reason)

def compile_log_success(submissionid):
    """Reports a server-side success to the backend"""
    logging.info('Compilation succeeded')
    compile_report_result(submissionid, COMPILE_SUCCESS)

def compile_worker(submissionid):
    """
    Performs a compilation job as specified in submissionid
    Message format: {submissionid}
    A single string containing the submissionid

    Filesystem structure:
    /box/
        `-- source.zip
        `-- src/
        |   `-- <package name>/
        |       `-- all .java sources
        `-- build/
            `-- classes/
                `-- <package-name>/
                |   `-- all compiled .class files
                `-- player.zip
    """

    client = storage.Client()
    bucket = client.get_bucket(GCLOUD_BUCKET_SUBMISSION)

    rootdir   = os.path.join('/', 'box')
    sourcedir = os.path.join(rootdir, 'src')
    builddir  = os.path.join(rootdir, 'build')
    classdir  = os.path.join(builddir, 'classes')

    try:
        # Obtain compressed archive of the submission
        try:
            os.mkdir(sourcedir)
            with open(os.path.join(rootdir, 'source.zip'), 'wb') as file_obj:
                bucket.get_blob(os.path.join(submissionid, 'source.zip')).download_to_file(file_obj)
        except:
            compile_log_error(submissionid, 'Could not retrieve source file from bucket')



        # Decompress submission archive
        result = util.monitor_command(
            ['unzip', 'source.zip', '-d', sourcedir],
            cwd=rootdir,
            timeout=TIMEOUT_UNZIP)
        if result[0] != 0:
            compile_log_error(submissionid, 'Could not decompress source file')

        # Update distribution
        util.pull_distribution(rootdir, lambda: compile_log_error(submissionid, 'Could not pull distribution'))

        # Execute compilation
        result = util.monitor_command(
            ['./gradlew', 'build', '-Psource={}'.format(sourcedir)],
            cwd=rootdir,
            timeout=TIMEOUT_COMPILE)

        # Only one package allowed per submission
        try:
            packages = os.listdir(classdir)
        except:
            # No classes were generated after compiling
            compile_log_fail(submissionid, 'No classes generated')
        else:
            if result[0] == 0 and len(packages) == 1:
                # Compress compiled classes
                result = util.monitor_command(
                    ['zip', '-r', 'player.zip', packages[0]],
                    cwd=classdir,
                    timeout=TIMEOUT_COMPILE)

                # Send package to bucket for storage
                if result[0] == 0:
                    try:
                        with open(os.path.join(classdir, 'player.zip'), 'rb') as file_obj:
                            bucket.blob(os.path.join(submissionid, 'player.zip')).upload_from_file(file_obj)
                    except:
                        compile_log_error(submissionid, 'Could not send executable to bucket')
                    compile_log_success(submissionid)
                else:
                    compile_log_error(submissionid, 'Could not compress compiled classes')
            else:
                compile_log_fail(submissionid, 'Compilation process failed, or no classes generated')
    finally:
        # Clean up working directory
        try:
            shutil.rmtree(sourcedir)
            os.remove(os.path.join(rootdir, 'source.zip'))
            shutil.rmtree(builddir)
        except:
            logging.warning('Could not clean up compilation directory')


if __name__ == '__main__':
    subscription.subscribe(GCLOUD_SUB_COMPILE_NAME, compile_worker, give_up=True)
