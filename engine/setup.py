from setuptools import setup, find_packages

setup(name='battlehack20',
      version=0.1,
      description='Battlehack SP20 game engine.',
      url=None,
      author='Battlecode',
      author_email='battlecode@mit.edu',
      license='MIT',
      packages=find_packages(),
      install_requires=[
            'RestrictedPython==4.0b4'
      ],
      zip_safe=False)
