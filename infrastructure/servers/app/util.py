from config import *

import subprocess, threading

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
    try:
        result = monitor_command(
            ['./pull_dist.sh'],
            cwd=cwd,
            timeout=TIMEOUT_PULL)
        if result[0] != 0:
            raise RuntimeError
    except:
        onerror()
