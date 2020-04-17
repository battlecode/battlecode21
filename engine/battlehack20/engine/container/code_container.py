import re
from os import listdir
from os.path import isfile, join
from .instrument import Instrument

import marshal, pickle
from RestrictedPython import compile_restricted


class CodeContainer:
    def __init__(self, code):
        self.code = code

    @classmethod
    def from_directory_dict(cls, dic):
        code = {}

        for filename in dic:
            module_name = filename.split('.py')[0]
            compiled = compile_restricted(cls.preprocess(dic[filename]), filename, 'exec')
            code[module_name] = Instrument.instrument(compiled)

        return cls(code)

    @classmethod
    def from_directory(cls, dirname):
        files = [(f, join(dirname,f)) for f in listdir(dirname) if f[-3:] == '.py' and isfile(join(dirname, f))]

        code = {}
        for filename, location in files:
            with open(location) as f:
                code[filename] = f.read()

        return cls.from_directory_dict(code)

    def to_bytes(self):
        packet = {}
        for key in self.code:
            packet[key] = marshal.dumps(self.code[key])

        return pickle.dumps(packet)

    @classmethod
    def from_bytes(cls, codebytes):
        packet = pickle.loads(codebytes)

        for key in packet:
            packet[key] = marshal.loads(packet[key])

        return cls(packet)

    def to_file(self, filename):
        with open(filename, 'wb') as f:
            f.write(self.to_bytes())

    @classmethod
    def from_file(cls, filename):
        with open(filename, 'rb') as f:
            return cls.from_bytes(cls.preprocess(f.read()))

    @classmethod
    def preprocess(cls, content):
        """
        Strips battlehack20.stubs imports from the code.

        It removes lines containing one of the following imports:
        - from battlehack20.stubs import *
        - from battlehack20.stubs import a, b, c

        The regular expression that is used also supports non-standard whitespace styles like the following:
        - from battlehack20.stubs import a,b,c
        - from  battlehack20.stubs  import  a,  b,  c

        Go to https://regex101.com/r/bhAqFE/6 to test the regular expression with custom input.
        """

        pattern = r'^([ \t]*)from([ \t]+)battlehack20\.stubs([ \t]+)import([ \t]+)(\*|([a-zA-Z_]+([ \t]*),([ \t]*))*[a-zA-Z_]+)([ \t]*)$'

        # Replace all stub imports
        while True:
            match = re.search(pattern, content, re.MULTILINE)

            if match is None:
                break

            # Remove the match from the content
            start = match.start()
            end = match.end()
            content = content[0:start] + content[end:]

        return content

    def __getitem__(self, key):
        return self.code[key]

    def __contains__(self, key):
        return key in self.code
