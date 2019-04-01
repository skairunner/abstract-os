from copy import deepcopy


"""
SimulationState is intended to be a mostly immutable record of the simulation
's internal state at a given point in time. The intended use case is to reflect
a sim step's changes into a new SimState, then never edit it.
"""
# Need to store simulation state for supporting rewinding
class SimulationState:
    def __init__(self, *, memorysize=100, time=0):
        self.time = time

    def __deepcopy__(self):
        simstate = SimulationState(time=self.time)
        return simstate


class Simulation:
    def __init__(self):
        self.history = []
        self.current = SimulationState()

    def step(self):
        self.history.append(self.current)
        self.current = deepcopy(self.current)
        self.current.time += 1


if __name__ == '__main__':
    s = Simulation()
    for i in range(10):
        s.step()
