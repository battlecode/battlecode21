from setuptools import setup, find_packages

setup(name='battlecode',
      version=0.1,
      description='battlecode python engine',
      url=None,
      author='Battlecode',
      author_email='battlecode@mit.edu',
      license='MIT',
      packages=find_packages(),
      install_requires=[
            'RestrictedPython==4.0b4'
      ],
      zip_safe=False)
