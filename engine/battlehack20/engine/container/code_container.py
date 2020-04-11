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
            compiled = compile_restricted(dic[filename], filename, 'exec')
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
            return cls.from_bytes(f.read())

    def __getitem__(self, key):
        return self.code[key]

    def __contains__(self, key):
        return key in self.code
