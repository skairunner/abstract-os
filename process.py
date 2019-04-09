import algorithms as algo
from copy import deepcopy
import json
from processstate import ProcessState


class Process:
    def __init__(self, pagemngr, pid, *, initial_pages=1, name=None, spawned=None):
        self.pages = []
        for i in range(initial_pages):
            self.pages.append(pagemngr.make_page(7392))
        self.state = ProcessState.NEW
        self.pid = pid
        self.name = str(pid) if name is None else name
        self.spawned = spawned  # What time the process was created
        self.ended = None  # What time the process was terminated
        self.extra = None

        self.work = 100
        self.workdone = 0

    def run(self, time):
        if self.workdone + time >= self.work:
            self.state = ProcessState.EXIT
            leftover = time - (self.work - self.workdone)
            self.work = self.workdone
            return leftover
        else:
            self.work += time
            return 0

    def serialize(self):
        # Return a JSON string that represents this object.
        obj = {}
        obj['objtype'] = 'process'
        obj['state'] = self.state.value
        obj['pid'] = self.pid
        obj['pages'] = [x.uid for x in self.pages]
        obj['name'] = self.name
        obj['spawned'] = self.spawned
        obj['ended'] = self.ended
        return json.dumps(obj)


class Scheduler:
    def __init__(self):
        self.processes = []
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
