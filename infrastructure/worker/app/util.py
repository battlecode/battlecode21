from config import *

import os, subprocess, signal, threading, logging, requests

class NoTimer:
    def __init__(self):
        pass
    def start(self):
        pass
    def cancel(self):
        pass

def monitor_command(command, cwd, timeout=0):
    """
    Executes a command-line instruction, with a specified timeout (or 0 for no timeout)
    Returns (exitcode, stdout, stderr) upon completion.
    Upon timeout, exitcode is -9 (on UNIX only)
    """

    return_code = None
    subproc = subprocess.Popen(command,
         stdout=subprocess.PIPE,
         stderr=subprocess.PIPE,
         cwd=cwd,
         preexec_fn=os.setsid)

    to = NoTimer()
    if timeout > 0:
        to = threading.Timer(timeout, os.killpg, (os.getpgid(subproc.pid), signal.SIGKILL))
    try:
        to.start()
        for line in subproc.stderr:
            line = line.decode()[:-1] # Remove trailing newline
            logging.info("[subprocess stderr]  {}".format(line))
        proc_stdout, proc_stderr = subproc.communicate()
        return (subproc.returncode, proc_stdout.decode(), proc_stderr.decode())
    finally:
        to.cancel()


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
        return response.json()['access']
    except:
        logging.error('Could not obtain API authentication token')
