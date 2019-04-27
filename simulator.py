from copy import deepcopy
import json
from memory import PhysicalMemory
from page import PageManager
from process import Scheduler, Process, load_program_to_process


"""
SimulationState is intended to be a mostly immutable record of the simulation
's internal state at a given point in time. The intended use case is to reflect
a sim step's changes into a new SimState, then never edit it.
"""
# Need to store simulation state for supporting rewinding
class SimulationState:
    def __init__(self, *, memorysize=10):
        self.time = 0  # This state's wall duration
        self.clock = 0  # The current wall clock
        self.mem = PhysicalMemory(memorysize)
        self.pagemngr = PageManager(self.mem)
        self.sched = Scheduler()
        self.pidcount = 0
        self.pid = None

    def serialize(self):
        obj = {}
        obj['clock'] = self.clock
        obj['time'] = self.time
        obj['pid'] = self.pid
        obj['mem'] = self.mem.serialize()
        obj['pagemngr'] = self.pagemngr.serialize()
        obj['scheduler'] = self.sched.serialize()
        return obj


class Simulation:
    def __init__(self, *, memorysize=10):
        self.history = []
        self.current = SimulationState(memorysize=memorysize)
        self.slice_length = 100

    def step(self):
        self.history.append(self.current)
        self.current = deepcopy(self.current)
        self.current.pagemngr.faults = 0  # Reset fault count
        pid, timeused = self.current.sched.run(self.slice_length, self.current.clock)
        self.current.pid = pid
        # This should be streamlined later
        self.current.time = timeused
        self.current.clock += timeused

    def spawn_process(self, proc_spec):
        state = self.current
        p = load_program_to_process(state.pagemngr, state.pidcount, proc_spec.name, proc_spec.script, state.time)
        state.sched.admit(p)
        state.pidcount += 1
