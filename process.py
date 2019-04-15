import algorithms as algo
from copy import deepcopy
import json
from processstate import ProcessState
import random


class Process:
    def __init__(self, pagemngr, pid, *, initial_pages=1, name=None, spawned_at=None):
        self.pages = []
        self.pagemngr = pagemngr
        for i in range(initial_pages):
            self.pages.append(pagemngr.make_page(random.randint(0, 12)))
        self.state = ProcessState.NEW
        self.pid = pid
        self.name = str(pid) if name is None else name
        self.spawned_at = spawned_at  # What time the process was created
        self.ended = None  # What time the process was terminated
        self.extra = None

        self.work = 1000
        self.workdone = 0

    def free_memory(self):
        for page in self.pages:
            self.pagemngr.free_page(page.uid)
        self.pages = []

    def run(self, timestep):
        if self.workdone + timestep >= self.work:
            self.state = ProcessState.EXIT
            leftover = timestep - (self.work - self.workdone)
            self.workdone = self.work
            return leftover
        else:
            self.workdone += timestep
            return 0

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

        while timestep > 0:
            process = self.pick_process(self)
            if process is None:
                return
            process.state = ProcessState.RUNNING
            timestep = process.run(timestep)
            # do handling for finished process or i/o waiting
            if process.state == ProcessState.EXIT:
                self.terminate_process(self, process)
                process.state = ProcessState.DONE
                process.ended = time
                process.free_memory()
                self.term_procs.append(process)
                self.processes.remove(process)

    def serialize(self):
        obj = {'processes': [x.serialize() for x in self.processes]}
        obj['term_procs'] = [x.serialize() for x in self.term_procs]
        return obj
