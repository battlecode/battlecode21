#!/usr/bin/env python3

"""
Here's what this script does:
* Generates a comparison link to review the changes
* Adds version number and changelog to specs/specs.md
* Converts `specs.md` into a fancy specs html document (`frontend/public/specs.html`).
* Deploys the frontend.
* Publishes the updated package to PyPi.
* Commits, tags and pushes.

"""

import argparse
import subprocess
import os

def main(version):
    generate_comparison_link()

    specs(version)

    fancy_specs()

    deploy_frontend()

    publish_pypi()

    commit_tag_push()


def generate_comparison_link():
    """
    Generate a comparison link like https://github.com/battlecode/battlecode20/compare/commit...commit
    comparing the most recent commit with the latest released version.
    """
    # get latest tag
    latest_tag = subprocess.check_output("git tag --sort=committerdate | tail -1", shell=True).decode("utf-8").strip('\n')
    # get commit
    commit = subprocess.check_output("git rev-list -n 1 " + latest_tag, shell=True).decode('utf-8').strip('\n')

    # get latest commit
    latest = subprocess.check_output("git rev-parse HEAD", shell=True).decode('utf-8').strip('\n')

    # print the link
    link = "https://github.com/battlecode/battlehack20/compare/" + commit + "..." + latest
    print("Go to the following link and check out the differences:")
    print(link)

    # wait until the user says yes
    response = input("enter 'y' to proceed with the release: ")
    while response != 'y':
        response = input("enter 'y' to proceed with the release: ")


def specs(version):
    with open('specs/specs.md', 'r') as f:
        gr = f.read()

    # prompt for changelog in specs, engine
    l = ['spec', 'engine']
    d = {i: [] for i in l}
    for i in l:
        while True:
            x = input(i + " change: ")
            if x == "":
                break
            d[i].append(x)
    now = datetime.now()
    changelogstring = "- " + version + " (" + str(now.month) + "/" + str(now.day) + "/" + str(now.year)[2:] + ")\n"
    for i in l:
        changelogstring += "    - " + i + " changes:"
        if len(d[i]) == 0:
            changelogstring += " none\n"
        else:
            changelogstring += "\n"
        for dd in d[i]:
            changelogstring += "        - " + dd + '\n'
    g = gr.split('\n')
    for i in range(len(g)):
        if "# Changelog" in g[i]:
            g.insert(i+2, changelogstring.rstrip())
        if "Current version: " in g[i]:
            g[i] = "Current version: " + version
    gr = "\n".join(g)
    with open('specs/specs.md', 'w') as f:
        f.write(gr)

def fancy_specs():
    os.chdir('specs')
    subprocess.call('pandoc specs.md --self-contained --template template.html --toc -o specs.html --metadata pagetitle="Battlehack SP20 Specs"', shell=True)
    os.chdir('..')
    subprocess.call('cp specs/specs.html frontend/public/specs.html', shell=True)

    
def deploy_frontend():
    os.chdir('frontend')
    subprocess.call('./deploy.sh deploy', shell=True)
    os.chdir('..')

def publish_pypi():
    os.chdir('engine')
    subprocess.call('python3 setup.py sdist bdist_wheel')
    subprocess.call('twine upload --skip-existing dist/*')
    os.chdir('..')

def commit_tag_push(version):
    subprocess.call(f'git tag v{version}', shell=True)
    subprocess.call('git push --tags', shell=True)
    subprocess.call(f'git commit -am release {version}', shell=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument('version', help='Version number, e.g. 0.1.1')

    args = parser.parse_args()

    main(args.version)
