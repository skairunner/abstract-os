import algorithms as algo
from copy import deepcopy
from processstate import ProcessState


class Process:
    def __init__(self, pagemngr, pid, *, initial_pages=1, name=None):
        self.pages = []
        for i in range(initial_pages):
            self.pages.append(pagemngr.make_page(7392))
        self.state = ProcessState.NEW
        self.pid = pid
        self.name = str(pid) if name is None else name
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

    def run(self, time):
        for process in self.processes:
            if process.state == ProcessState.RUNNING:
                process.state = ProcessState.READY

        while time > 0:
            process = self.pick_process(self)
            if process is None:
                return
            process.state = ProcessState.RUNNING
            time = process.run(time)
            # do handling for finished process or i/o waiting
            if process.state == ProcessState.EXIT:
                self.terminate_process(self, process)
                process.state = ProcessState.DONE
