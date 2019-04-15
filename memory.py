import algorithms as algo
import exceptions
import json

"""
Simulates physical memory.
Our model is segmented, with paging, so the smallest op size is 1 frame.
Memory is stored as a list, and each element is one frame. Data is represented
as an integer, making it possible to simulate the effects of trampling memory
due to student error, as well as allowing for more interesting visualization.

PhysicalMemory uses the following methods from algorithms.py:
    - allocate_page
    - free_page
"""
class PhysicalMemory:
    def __init__(self, framecount):
        # Creates physical memory with `framecount` frames.

        self.framecount = framecount
        self.state = [0 for x in range(framecount)]
        self.in_use = 0  # How many frames are currently being used, via counting alloc/free calls
        self.freelist = []
        self.allocate_memory = algo.allocate_memory
        self.free_memory = algo.free_memory

    def get(self, addr):
        # Get the data at addr

        return self.state[addr]

    def set(self, addr, data):
        # Set the data at addr

        self.state[addr] = data

    def alloc(self, data):
        # Find an unused frame, set the data and return its address

        addr = self.allocate_memory(self.freelist)
        try:
            self.state[addr] = data
        except IndexError:
            raise exceptions.AddressInvalid(f"Hardware error: memory panic @ {addr} (address doesn't exist)")
        self.in_use += 1
        return addr

    """
    Conduct a free operation on physical memory at frame `addr`.
    The actual bytes are not overwritten, but the free_page method is called.
    This allows the alloc algorithm to keep track of truly free memory.
    :param addr: The numerical frame to free.
    """
    def free(self, addr):
        # Upon mem free request, calls the free_page method

        self.free_memory(self.freelist, addr)
        self.in_use -= 1

    def serialize(self):
        # Return a JSON string that represents this object.
        obj = {}
        obj['objtype'] = 'mem'
        obj['framecount'] = self.framecount
        obj['memory'] = self.state
        obj['in_use'] = self.in_use
        obj['freelist'] = self.freelist
        return obj
