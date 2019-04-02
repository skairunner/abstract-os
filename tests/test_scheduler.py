from process import Scheduler, Process
from processstate import ProcessState

class FakeProcess:
    def __init__(self):
        self.state = ProcessState.NEW
        self.work = 100
        self.workdone = 0

    def run(self, time):
        self.workdone += time
        if self.workdone >= self.work:
            self.state = ProcessState.EXIT
        return 0

def test_scheduler_runs():
    ps = FakeProcess()
    sched = Scheduler()
    sched.admit(ps)
    assert ps.state == ProcessState.READY
    sched.run(10)
    assert ps.workdone == 10
    assert ps.state == ProcessState.RUNNING

def test_scheduler_switches():
    ps1 = FakeProcess()
    ps2 = FakeProcess()
    sched = Scheduler()
    sched.admit(ps1)
    sched.admit(ps2)
    sched.run(90)
    assert ps1.workdone == 90
    sched.run(10)
    assert ps1.workdone == 100
    sched.run(10)
    assert ps2.workdone == 10
    assert ps1.state == ProcessState.DONE
