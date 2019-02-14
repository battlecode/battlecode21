import dis
from types import CodeType
from types import SimpleNamespace

def build(bytecode, new_code, new_names, new_co_consts):
    return CodeType(bytecode.co_argcount,
                    bytecode.co_kwonlyargcount,
                    bytecode.co_nlocals,
                    bytecode.co_stacksize,
                    bytecode.co_flags,
                    new_code,
                    new_co_consts,
                    new_names,
                    bytecode.co_varnames,
                    bytecode.co_filename,
                    bytecode.co_name,
                    bytecode.co_firstlineno,
                    bytecode.co_lnotab,
                    bytecode.co_freevars,
                    bytecode.co_cellvars)


class Instruction(SimpleNamespace):
    def __init__(self, instruction, in_dict=None):
        if in_dict is not None:
            super().__init__(**in_dict)
        else:
            super().__init__(**{a:b for a,b in 
                zip(dis.Instruction._fields+('jump_to',), instruction + (None,))
            })

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
            'starts_line':None, 'is_jump_target':False
        })

    def calculate_offset(self, instructions):
        # Return the offset (rel or abs) to self.jump_to in instructions
        target_loc = 2 * instructions.index(self.jump_to)

        if self.is_abs_jumper():
            return target_loc

        self_loc = 2 * instructions.index(self)

        return target_loc - self_loc - 2


def instrument(bytecode):
    # Ensure all code constants (eg list comprehensions) are also
    # instrumented.
    new_co_consts = []
    for i, constant in enumerate(bytecode.co_consts):
        if type(constant) == CodeType:
            new_co_consts.append(instrument(constant))
        else:
            new_co_consts.append(constant)
    new_co_consts = tuple(new_co_consts)
                        

    instructions = list(dis.get_instructions(bytecode))

    # First, we define our injection.
    injection = [
        dis.Instruction(opcode=116, opname='LOAD_GLOBAL', arg=len(bytecode.co_names), argval=len(bytecode.co_names), argrepr=len(bytecode.co_names), offset=None, starts_line=None, is_jump_target=False),
        dis.Instruction(opcode=131, opname='CALL_FUNCTION', arg=0, argval=0, argrepr=0, offset=None, starts_line=None, is_jump_target=False),
        dis.Instruction(opcode=1, opname='POP_TOP', arg=None, argval=None, argrepr=None, offset=None, starts_line=None, is_jump_target=False)
    ]


    # For maintence we add an empty jump_to field to each instruction.
    for i, instruction in enumerate(instructions):
        instructions[i] = Instruction(instruction)

    # Next, we cache a reference to the jumpers to each jump target in the targets.
    for i, instruction in enumerate(instructions):
        # We're only looking for jumpers.
        if not instruction.is_jumper():
            continue

        target = [t for t in instructions if instruction.argval == t.offset][0]
        instruction.jump_to = target

    # We then inject the injection before every call, except for those
    # following an EXTENDED_ARGS.
    for cur, last in zip(instructions[:], [None]+instructions[:-1]):        
        cur_index = instructions.index(cur)

        if last is not None and last.opcode == 144:
            continue

        for j, inject in enumerate(injection):
            instructions.insert(cur_index + j, Instruction(inject))


    fixed = False
    while not fixed:
        #
        # Iterate through instructions.
        #
        #   If it's a jumper, calculate the new correct offset.
        #
        #   For each new offset, if it is too large to fit in the current
        #   number of EXTENDED_ARGS, inject a new EXTENDED_ARG before it.
        #
        # If you never insert a new EXTENDED_ARGS, break out of the loop.

        fixed = True

        i = 0
        for instruction in instructions[:]:
            instruction.offset = 2*i
            
            if not instruction.is_jumper():
                i += 1
                continue

            correct_offset = instruction.calculate_offset(instructions)
            instruction.arg = correct_offset % 256
            correct_offset >>= 8

            extended_args = 0
            while correct_offset > 0:
                # Check if there is already an EXTENDED_ARGS behind.
                if i > extended_args and instructions[i-extended_args-1].opcode == 144:
                    instructions[i-extended_args-1].arg = correct_offset % 256

                # Otherwise, insert a new one.
                else:
                    instructions.insert(i, Instruction.ExtendedArgs(correct_offset % 256))
                    
                    i += 1
                    fixed = False
                
                correct_offset >>= 8
                extended_args += 1

            i += 1

    # Finally, we repackage up our instructions into a bytestring, and send off.
    byte_array = [[i.opcode, 0 if i.arg is None else i.arg] for i in instructions]
    byte_string = bytes(sum(byte_array, []))
    new_names = tuple(bytecode.co_names) + ('__instrument__', )

    return build(bytecode, byte_string, new_names, new_co_consts)