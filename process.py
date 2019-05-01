from enum import Enum, auto
import algorithms as algo
from copy import deepcopy
import json
from processstate import ProcessState
import exceptions
import random


class Operation(Enum):
    WORK = 1
    ACQUIRE = 2
    MALLOC = 3
    RELEASE = 4
    WRITE = 5
    READ = 6
    FREE = 7


# RESOURCES IN ACQUIRE SHOULD BE A PRE CONSTRUCTED ENUM FROM INIT AND SYSTEM DEFINITIONS
def load_program(scriptname):
    if not scriptname: return [(Operation.WORK, 10, '')]
    program = []
    with open('programs/' + scriptname) as txt:
        for line in txt:
            if line[0] == '#' or line == '\n': continue
            instruction = line.split()
            instruction[0] = Operation[instruction[0].upper()]
            if instruction[0] == Operation.WORK:
                instruction[1] = int(instruction[1])
            elif instruction[0] == Operation.WRITE:
                instruction[2] = int(instruction[2])
            # Ensure instruction is at least len 3
            instruction += [''] * (3 - len(instruction))
            program.append(tuple(instruction))
    return program


class Process:
    def __init__(self, pagemngr, scriptname, pid, *, initial_pages=1, name=None, spawned_at=None):
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

        self.unfinished_work = 0
        self.program = load_program(scriptname)
        self.program_counter = 0
        # ('a', 10, pageref),
        # Stores what data *should* be in a page. Helps with visualizing logic errors.
        self.remember = []
        self.mem_consistency = {}
        self.ops = {
            Operation.MALLOC: self._op_malloc,
            Operation.FREE: self._op_free,
            Operation.READ: self._op_read,
            Operation.WRITE: self._op_write,
            Operation.ACQUIRE: self._op_acquire,
            Operation.RELEASE: self._op_release,
            Operation.WORK: self._op_work,
        }

    def _op_malloc(self, arg1, arg2):
        new_page = self.pagemngr.make_page(0)
        self.remember.append((arg1, 0, new_page))
        self.pages.append(new_page)

    def _op_write(self, arg1, arg2):
        for i, (var, val, page) in enumerate(self.remember):
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

    # TODO: Implement resource system
    def _op_acquire(self, arg1, arg2):
        pass

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

    """
    The scheduler will call run() with the time slice. This is the maximum
    cpu time that the process can use. run() must return the amount of its
    slice that has been left unused, e.g. because it is blocked.
    """
    def run(self, timestep):
        time_used = 0  # Time used in this slice
        while self.program_counter < len(self.program):
            operation, arg1, arg2 = self.program[self.program_counter]

            if operation == Operation.WORK:
                # For work, arg1 is work duration
                # Case: Done with this step of work
                if self.unfinished_work + timestep - time_used >= arg1:
                    # Since it is finished, set time and go to next line
                    time_used += arg1 - self.unfinished_work
                    self.unfinished_work = 0  # Reset memoed work
                    self.program_counter += 1
                    continue
                # Case: Not done with this step of work
                else:
                    # Add the right amount of work to memo
                    self.unfinished_work += timestep - time_used
                    time_used = timestep
                    return time_used
                # todo: fix work interactions
            else:
                self.ops[operation](arg1, arg2)
                self.program_counter += 1

        # Program terminates here.
        self.state = ProcessState.EXIT
        return time_used

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
        obj['program_counter'] = self.program_counter
        obj['program_length'] = len(self.program)
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
        timeused = process.run(timestep)
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
