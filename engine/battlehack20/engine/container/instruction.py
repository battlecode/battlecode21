import dis
from types import SimpleNamespace

class Instruction(SimpleNamespace):
    def __init__(self, instruction, in_dict=None):
        if in_dict is not None:
            super().__init__(**in_dict)
        else:
            super().__init__(**{a:b for a,b in zip(dis.Instruction._fields+('jump_to', 'was_there'), instruction + (None, True))})

    def is_jumper(self):
        return self.is_abs_jumper() or self.is_rel_jumper()

    def is_rel_jumper(self):
        return self.opcode in dis.hasjrel

    def is_abs_jumper(self):
        return self.opcode in dis.hasjabs

    @classmethod
    def ExtendedArgs(self, value):
        return Instruction(None, in_dict={
            'opcode':144, 'opname':'EXTENDED_ARGS', 'arg':value,
            'argval':value, 'argrepr':value, 'offset':None,
            'starts_line':None, 'is_jump_target':False, 'was_there': False
        })

    def calculate_offset(self, instructions):
        # Return the offset (rel or abs) to self.jump_to in instructions
        target_loc = 2 * instructions.index(self.jump_to)

        if self.is_abs_jumper():
            return target_loc

        self_loc = 2 * instructions.index(self)

        return target_loc - self_loc - 2
