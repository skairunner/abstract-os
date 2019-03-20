from algorithms import allocate_memory
import types


class SimulatorException(BaseException):
    pass


class IllegalMemoryAllocation(SimulatorException):
    pass


class NotEnoughMemoryAllocated(SimulatorException):
    pass


"""
The Memory class wraps the raw representation (usually a raw array of tuples)
and provides utility functions, such as erroring on invalid allocations or
querying for the next empty memory block, and so on.
"""
class Memory:
    def __init__(self, size, state=None):
        self.size = size
        # State should be an array of tuple pairs: (offset, range).
        self.state = [] if state is None else state

    """
    Query if given range is free, then allocate memory and sort state tuple.
    :raises: if memory already allocated.
    """
    def alloc(self, offset, memrange):
        if self.is_occupied(offset, memrange):
            raise IllegalMemoryAllocation(f'The range ({offset}, {memrange}) is already in use.')
        self.state.append((offset, memrange))
        self.state.sort(key=lambda x: x[0])

    def is_occupied(self, offset, memrange):
        # State tuple should always be sorted by offset, making queries slightly faster
        # Could probably do a binary search but it's not worthwhile for speed
        for mem in self.state:
            if mem[0] > offset + memrange:
                return False  # Cannot be in use
            """
            A |--|
            B    |--|
            C      |---|
            (A,B) and (A,C) do not overlap, because memrange is [offset, offset+memrange)
            """
            if offset + memrange <= mem[0]:
                return False  # Bc sorted from low to high offset
            # Other direction, means need to check next tuple
            if mem[0] + mem[1] <= offset:
                continue
            # Otherwise it's in use
            return True
        return False

    def clone(self):
        # Clone list. The tuples are immutable.
        return Memory(self.size, self.state[:])


# To check that the student really allocated the right amount of mem
class MallocGuard:
    def __init__(self, memcount, memstate):
        self.memstate = memstate
        self.memcount = memcount
        self.alloced = 0

    def __enter__(self):
        # Temporarily replace the alloc function
        alloc = self.memstate.alloc
        self.alloc = alloc

        def new_alloc(memstate, offset, memrange):
            alloc(offset, memrange)
            self.alloced += memrange

        self.memstate.alloc = types.MethodType(new_alloc, self.memstate)
        return self

    # restore the alloc
    def __exit__(self, type, value, traceback):
        self.memstate.alloc = self.alloc
        if self.alloced < self.memcount:
            raise NotEnoughMemoryAllocated(f'Only allocated {self.alloced} memory when requested {self.memcount} memory.')


class Process:
    def __init__(self):
        self.malloced = []  # The list of memory tuples allocated to this process

    def clone(self):
        p = Process()
        p.malloced = self.malloced[:]
        return p


"""
SimulationState is intended to be a mostly immutable record of the simulation
's internal state at a given point in time. The intended use case is to reflect
a sim step's changes into a new SimState, then never edit it.
"""
# Need to store simulation state for supporting rewinding
class SimulationState:
    def __init__(self, *, memorysize=100, time=0):
        self.memory = Memory(memorysize)
        self.active_processes = []
        self.time = time

    def clone(self):
        simstate = SimulationState(time=self.time)
        simstate.memory = self.memory.clone()
        return simstate


# These are temporary variables
MEMORY_ALLOCS = [(1, 50), (3, 20), (5, 10)]  # (time, range)
# Currently does not have a Free implemnetaiton, once given out memory is
# permanently occupied :P
class Simulation:
    def __init__(self):
        self.history = []
        self.current = SimulationState()

    def step(self):
        self.history.append(self.current)
        self.current = self.current.clone()
        self.current.time += 1
        for time, mem in MEMORY_ALLOCS:
            if time == self.current.time:
                # Call out to the student's algo
                with MallocGuard(mem, self.current.memory):
                    tuples = allocate_memory(mem, self.current.memory)
                # Check returned enough memory
                total = sum([x[1] for x in tuples])
                if total < mem:
                    raise NotEnoughMemoryAllocated(f'The returned memory tuples summed up to {total} when you need {mem}. Did you return the right number of tuples?')


if __name__ == '__main__':
    s = Simulation()
    for i in range(10):
        s.step()
        print(s.current.memory.state)
