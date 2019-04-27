from enum import Enum, auto
import algorithms as algo
from copy import deepcopy
import json
from processstate import ProcessState
import exceptions
import random


class Operation(Enum):
    Work = 1
    Acquire = 2
    Malloc = 3
    Release = 4
    Write = 5
    Read = 6
    Free = 7


# RESOURCES IN ACQUIRE SHOULD BE A PRE CONSTRUCTED ENUM FROM INIT AND SYSTEM DEFINITIONS
def load_program_to_process(pagemngr, pid, name, scriptname, spawned_at=None):
    new_proc = Process(pagemngr, pid, name=name, spawned_at=spawned_at)
    with open('programs/' + scriptname) as txt:
        for line in txt:
            line = line.split()
            instruction = []
            op = line[0].lower()
            if op == Operation.Work.name.lower():
                instruction.append(Operation.Work)
                instruction.append(int(line[1]))
            elif op == Operation.Acquire.name.lower():
                instruction.append(Operation.Acquire)
                instruction.append(line[1])
            elif op == Operation.Malloc.name.lower():
                instruction.append(Operation.Malloc)
                instruction.append(line[1])
            elif op == Operation.Write.name.lower():
                instruction.append(Operation.Write)
                instruction.append(line[1])
                instruction.append(int(line[2]))
            elif op == Operation.Read.name.lower():
                instruction.append(Operation.Read)
                instruction.append(line[1])
            elif op == Operation.Free.name.lower():
                instruction.append(Operation.Free)
                instruction.append(line[1])
            elif op == Operation.Release.name.lower():
                instruction.append(Operation.Release)
                instruction.append(line[1])
            else:
                raise exceptions.ProgramParsingException(f"No operation named {line[0]}.")
            instruction += [''] * (3 - len(instruction))
            new_proc.program.append(tuple(instruction))
    return new_proc


class Process:
    def __init__(self, pagemngr, pid, *, initial_pages=1, name=None, spawned_at=None):
        self.pages = []
        self.pagemngr = pagemngr
        for i in range(initial_pages):
            self.pages.append(pagemngr.make_page(random.randint(0, 1000)))
        self.state = ProcessState.NEW
        self.pid = pid
        self.name = str(pid) if name is None else name
        self.spawned_at = spawned_at  # What time the process was created
        self.ended = None  # What time the process was terminated
        self.extra = None

        self.workdone = 0
        self.unfinished_work = 0
        self.program = []
        self.program_counter = 0
        # waiting on resources, {'Y':True,'X':False}
        self.resources = {}
        # ('a', 10, pageref),
        self.remember = []
        self.mem_consistency = {}
        self.ops = {
            Operation.Malloc: self._op_malloc,
            Operation.Free: self._op_free,
            Operation.Read: self._op_read,
            Operation.Write: self._op_write,
            Operation.Acquire: self._op_acquire,
            Operation.Release: self._op_release,
            Operation.Work: self._op_work,
        }

    def _op_malloc(self, arg1, arg2):
        new_page = self.pagemngr.make_page(0)
        self.remember.append((arg1, 0, new_page))
        self.pages.append(new_page)

    def _op_write(self, arg1, arg2):
        for i, var, val, page in enumerate(self.remember):
            if var == arg1:
                self.remember[i] = (var, arg2, page)
                self.pagemngr.mem.set(page.addr, arg2)

    def _op_read(self, arg1, arg2):
        for var, val, page in self.remember:
            if var == arg1:
                if val == self.pagemngr.mem.get(page.addr):
                    self.mem_consistency[arg1] = True
                else:
                    self.mem_consistency[arg1] = False

    def _op_free(self, arg1, arg2):
        for var, val, page in self.remember:
            if var == arg1:
                self.pagemngr.mem.free(page.addr)

    def _op_acquire(self, arg1, arg2):
        if arg1 in self.resources:
            if not self.resources[arg1]:
                self.state = ProcessState.BLOCKED
                return 0
        else:
            # aquire resource
            self.resources[arg1] = False

    def _op_release(self, arg1, arg2):
        if arg1 in self.resources.keys():
            # release resource
            self.resources.pop(arg1)

    def _op_work(self, arg1, arg2):
        pass

    def free_memory(self):
        for page in self.pages:
            self.pagemngr.free_page(page.uid)
        self.pages = []

    def run(self, timestep):
        # Temporary until proper page access logic exists
        self.pagemngr.access_page(self.pages[0].uid)

        if self.resources:
            if not all(self.resources.values()):
                self.state = ProcessState.BLOCKED
                return 0

        while self.program_counter < len(self.program):
            operation, arg1, arg2 = self.program[self.program_counter]

            if operation == Operation.Work:
                pass
                # todo: fix work interactions

            self.ops[operation](arg1, arg2)

            self.program_counter += 1

        leftover = 0
        for op, a1, a2 in self.program:
            if op == Operation.Work:
                leftover += a1
        leftover -= self.workdone

        self.state = ProcessState.EXIT
        return leftover

    def serialize(self):
        # Return a JSON string that represents this object.
        obj = {}
        obj['objtype'] = 'process'
        obj['state'] = self.state.value
        obj['pid'] = self.pid
        obj['pages'] = [x.uid for x in self.pages]
        obj['name'] = str(self.pid) if self.name is None else self.name
        obj['spawned_at'] = self.spawned_at
        obj['ended'] = self.ended
        obj['workdone'] = self.workdone
        obj['program_counter'] = self.program_counter
        # obj['program'] = self.program
        obj['mem_consistency'] = self.mem_consistency
        return obj


class Scheduler:
    def __init__(self):
        self.processes = []
        self.term_procs = []
        self.admit_process = algo.admit_process
        self.pick_process = algo.pick_process
        self.terminate_process = algo.terminate_process
        algo.init_scheduler(self)

    def admit(self, process):
        self.admit_process(self, process)
        process.state = ProcessState.READY
        self.processes.append(process)

    """
    Run programs for a given timestep. Scheduler is in charge of updating process
    runtimes.
    :param timestep: The duration to simulate.
    :param time: The system time, intended for timestamp use.
    """
    def run(self, timestep, time):
        for process in self.processes:
            if process.state == ProcessState.RUNNING:
                process.state = ProcessState.READY

        process = self.pick_process(self)
        if process is None:
            return [None, timestep]  # Report that no process ran for slice
        process.state = ProcessState.RUNNING
        timeused = timestep - process.run(timestep)
        # do handling for finished process or i/o waiting
        if process.state == ProcessState.EXIT:
            self.terminate_process(self, process)
            process.state = ProcessState.DONE
            process.ended = time + timeused
            process.free_memory()
            self.term_procs.append(process)
            self.processes.remove(process)
        return [process.pid, timeused]

    def serialize(self):
        obj = {'processes': [x.serialize() for x in self.processes]}
        obj['term_procs'] = [x.serialize() for x in self.term_procs]
        return obj
