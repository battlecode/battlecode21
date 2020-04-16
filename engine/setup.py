from setuptools import setup, find_packages
from collections import OrderedDict

setup(name='battlehack20',
      version=0.1,
      description='Battlehack 2020 game engine.',
      author='Battlecode',
      author_email='battlecode@mit.edu',
      url="https://bh2020.battlecode.org",
      license='GNU General Public License v3.0',
      packages=find_packages(),
      project_urls=OrderedDict((
          ('Code', 'https://github.com/battlecode/battlehack20/tree/master/engine'),
          ('Documentation', 'https://github.com/battlecode/battlehack20/tree/master/engine')
      )),
      install_requires=[
            'RestrictedPython==4.0b4'
      ],
      python_requires='>=3, <3.8',
      zip_safe=False,
)
