from copy import deepcopy
import json
from memory import PhysicalMemory
from page import PageManager
from process import Scheduler, Process


"""
SimulationState is intended to be a mostly immutable record of the simulation
's internal state at a given point in time. The intended use case is to reflect
a sim step's changes into a new SimState, then never edit it.
"""
# Need to store simulation state for supporting rewinding
class SimulationState:
    def __init__(self, *, memorysize=10):
        self.time = 100  # This state's wall duration
        self.clock = 0  # The current wall clock
        self.mem = PhysicalMemory(memorysize)
        self.pagemngr = PageManager(self.mem)
        self.sched = Scheduler()
        self.pidcount = 0

    def serialize(self):
        obj = {}
        obj['clock'] = self.clock
        obj['time'] = self.time
        obj['mem'] = self.mem.serialize()
        obj['pagemngr'] = self.pagemngr.serialize()
        obj['scheduler'] = self.sched.serialize()
        return obj


class Simulation:
    def __init__(self, *, memorysize=10):
        self.history = []
        self.current = SimulationState(memorysize=memorysize)

    def step(self):
        self.history.append(self.current)
        self.current = deepcopy(self.current)
        self.current.sched.run(self.current.time, self.current.clock)
        # This should be streamlined later
        self.current.clock += self.current.time

    def spawn_process(self, name):
        state = self.current
        p = Process(state.pagemngr, state.pidcount, name=name, spawned_at=state.time)
        state.sched.admit(p)
