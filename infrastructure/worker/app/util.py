from config import *

import subprocess, threading
import requests, json

def monitor_command(command, cwd, timeout=0):
    """
    Executes a command-line instruction, with a specified timeout (or 0 for no timeout)
    Returns (exitcode, stdout, stderr) upon completion.
    Upon timeout, exitcode is -9 (on UNIX only)
    """
    subproc = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=cwd)
    if timeout > 0:
        to = threading.Timer(timeout, subproc.kill)
        try:
            to.start()
            proc_stdout, proc_stderr = subproc.communicate()
            return (subproc.returncode, proc_stdout, proc_stderr)
        finally:
            to.cancel()
    else:
        proc_stdout, proc_stderr = subproc.communicate()
        return (subproc.returncode, proc_stdout, proc_stderr)

def pull_distribution(cwd, onerror):
    """Updates the distribution, using the gradle update task"""
    try:
        result = monitor_command(
            ['./gradlew', 'update'],
            cwd=cwd,
            timeout=TIMEOUT_PULL)
        if result[0] != 0:
            raise RuntimeError
    except:
        onerror()

def get_api_auth_token():
    """Retrieves an API token for sending authenticated requests to the backend server"""
    try:
        response = requests.post(url=API_AUTHENTICATE, data={
            'username': API_USERNAME,
            'password': API_PASSWORD
        })
        response.raise_for_status()
        return json.loads(response.text)['access']
    except:
        logging.error('Could not obtain API authentication token')
