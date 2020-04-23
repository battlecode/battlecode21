import dis
import math
from types import CodeType
from .instruction import Instruction

class Instrument:
    """
    A class for instrumenting specific methods (e.g. sort) as well as instrumenting competitor code
    """
    def __init__(self, runner):
        self.runner = runner

    def instrumented_sorted(self, iterable, key=None, reverse=False):
        cost = len(iterable) * int(math.log(len(iterable)))
        self.runner.multinstrument_call(cost)
        if not key and not reverse:
            return sorted(iterable)
        elif not reverse:
            return sorted(iterable, key=key)
        elif not key:
            return sorted(iterable, reverse=reverse)
        return sorted(iterable, key=key, reverse=reverse)

    @staticmethod
    def instrument(bytecode):
        """
        The primary method of instrumenting code, which involves injecting a bytecode counter between every instruction to be executed

        :param bytecode: a code object, the bytecode submitted by the player
        :return: a new code object that has been injected with our bytecode counter
        """

        # Ensure all code constants (e.g. list comprehensions) are also instrumented.
        new_consts = []
        for i, constant in enumerate(bytecode.co_consts):
            if type(constant) == CodeType:
                new_consts.append(Instrument.instrument(constant))
            else:
                new_consts.append(constant)
        new_consts = tuple(new_consts)

        instructions = list(dis.get_instructions(bytecode))

        function_name_index = len(bytecode.co_names)  # we will be inserting our __instrument__ call at the end of co_names

        # the injection, which consists of a function call to an __instrument__ method which increments bytecode
        # these three instructions will be inserted between every line of instrumented code
        injection = [
            dis.Instruction(opcode=116, opname='LOAD_GLOBAL', arg=function_name_index%256, argval='__instrument__', argrepr='__instrument__', offset=None, starts_line=None, is_jump_target=False),
            dis.Instruction(opcode=131, opname='CALL_FUNCTION', arg=0, argval=0, argrepr=0, offset=None, starts_line=None, is_jump_target=False),
            dis.Instruction(opcode=1, opname='POP_TOP', arg=None, argval=None, argrepr=None, offset=None, starts_line=None, is_jump_target=False)
        ]
        #extends the opargs so that it can store the index of __instrument__
        while function_name_index > 255: #(255 = 2^8 -1 = 1 oparg)
            function_name_index >>= 8
            injection = [
                dis.Instruction(
                    opcode=144,
                    opname='EXTENDED_ARGS',
                    arg=function_name_index%256,
                    argval=function_name_index%256,
                    argrepr=function_name_index%256,
                    offset=None,
                    starts_line=None,
                    is_jump_target=False
                )
            ] + injection

        # For maintenance we add an empty jump_to field to each instruction
        for i, instruction in enumerate(instructions):
            instructions[i] = Instruction(instruction)

        # Next, we cache a reference to the jumpers to each jump target in the targets
        for i, instruction in enumerate(instructions):
            # We're only looking for jumpers
            if not instruction.is_jumper():
                continue

            target = [t for t in instructions if instruction.argval == t.offset][0]
            instruction.jump_to = target

            # If any targets jump to themselves, that's not kosher.
            if instruction == target:
                raise SyntaxError('No self-referential loops.')

        unsafe = {110, 113, 114, 115, 116, 120, 124, 125, 131}  # bytecode ops that break the instrument

        # We then inject the injection before every call, except for those following an EXTENDED_ARGS.
        cur_index = -1
        for (cur, last) in zip(instructions[:], [None]+instructions[:-1]):
            cur_index += 1
            if last is not None and last.opcode == 144: #EXTEND_ARG
                continue

            if last is not None and last.opcode in unsafe:
                continue

            for j, inject in enumerate(injection):
                injected_instruction = Instruction(inject)
                injected_instruction.was_there = False # keeping track of the instructions added by us
                instructions.insert(cur_index + j, injected_instruction)
            cur_index += len(injection)


        # Iterate through instructions. If it's a jumper, calculate the new correct offset. For each new offset, if it
        # is too large to fit in the current number of EXTENDED_ARGS, inject a new EXTENDED_ARG before it. If you never
        # insert a new EXTENDED_ARGS, break out of the loop.
        fixed = False
        while not fixed:
            fixed = True

            i = 0
            for instruction in instructions[:]:
                instruction.offset = 2 * i

                if not instruction.is_jumper():
                    i += 1
                    continue

                correct_offset = instruction.calculate_offset(instructions)
                instruction.arg = correct_offset % 256
                correct_offset >>= 8

                extended_args = 0
                while correct_offset > 0:
                    # Check if there is already an EXTENDED_ARGS behind
                    if i > extended_args and instructions[i - extended_args - 1].opcode == 144:
                        instructions[i - extended_args - 1].arg = correct_offset % 256

                    # Otherwise, insert a new one
                    else:
                        instructions.insert(i, Instruction.ExtendedArgs(correct_offset % 256))
                        instruction.extra_extended_args += 1
                        i += 1
                        fixed = False

                    correct_offset >>= 8
                    extended_args += 1
                i += 1
        #Maintaining correct line info ( traceback bug fix)
        #co_lnotab stores line information in Byte form
        # It stores alterantively, the number of instructions to the next increase in line number and
        # the increase in line number then
        #We need to ensure that these are bytes (You might want to break an increase into two see the article or code below)
        #The code did not update these bytes, we need to update the number of instructions before the beginning of each line
        #It should be similar to the way the jump to statement were fixed, I tried to mimick them but failed, I feel like I do not inderstand instruction.py
        # I am overestimating the number of instructions before the start of the line in this fix
        # you might find the end of this article helpful: https://towardsdatascience.com/understanding-python-bytecode-e7edaae8734d
        old_lnotab = {} #stores the old right info in a more usefull way (maps instruction num to line num)
        i = 0
        line_num = 0 #maintains line number by adding differences
        instruction_num = 0 #maintains the instruction num by addind differences
        while 2*i < len(bytecode.co_lnotab):
            instruction_num += bytecode.co_lnotab[2 * i]
            line_num += bytecode.co_lnotab[2 * i + 1]
            old_lnotab[instruction_num] = line_num
            i += 1
        #Construct a map from old instruction numbers, to new ones.
        num_injected = 0
        instruction_index = 0
        old_to_new_instruction_num = {}
        for instruction in instructions:
            if instruction.was_there:
                old_to_new_instruction_num[2 * (instruction_index - num_injected)] = 2 * instruction_index
            instruction_index += 1
            if not instruction.was_there:
                num_injected += 1
        new_lnotab = {}
        for key in old_lnotab:
            new_lnotab[old_to_new_instruction_num[key]] = old_lnotab[key]

        #Creating a differences list of integers, while ensuring integers in it are bytes
        pairs = sorted(new_lnotab.items())
        new_lnotab = []
        previous_pair = (0, 0)
        for pair in pairs:
            num_instructions = pair[0] - previous_pair[0]
            num_lines = pair[1] - previous_pair[1]
            while num_instructions > 127:
                new_lnotab.append(127)
                new_lnotab.append(0)
                num_instructions -= 127
            new_lnotab.append(num_instructions)
            while num_lines > 127:
                new_lnotab.append(127)
                new_lnotab.append(0)
                num_lines -= 127
            new_lnotab.append(num_lines)
            previous_pair = pair
        #tranfer to bytes and we are good :)
        new_lnotab = bytes(new_lnotab)

        # Finally, we repackage up our instructions into a byte string and use it to build a new code object
        byte_array = [[inst.opcode, 0 if inst.arg is None else inst.arg % 256] for inst in instructions]
        new_code = bytes(sum(byte_array, []))

        # Make sure our code can locate the __instrument__ call
        new_names = tuple(bytecode.co_names) + ('__instrument__', )

        return Instrument.build_code(bytecode, new_code, new_names, new_consts, new_lnotab)

    @staticmethod
    def build_code(old_code, new_code, new_names, new_consts, new_lnotab):
        """Helper method to build a new code object because Python does not allow us to modify existing code objects"""
        return CodeType(old_code.co_argcount,
                        old_code.co_kwonlyargcount,
                        old_code.co_nlocals,
                        old_code.co_stacksize,
                        old_code.co_flags,
                        new_code,
                        new_consts,
                        new_names,
                        old_code.co_varnames,
                        old_code.co_filename,
                        old_code.co_name,
                        old_code.co_firstlineno,
                        new_lnotab,
                        old_code.co_freevars,
                        old_code.co_cellvars)
