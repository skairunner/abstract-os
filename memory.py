import algorithms as algo
import exceptions

class PhysicalMemory:
    def __init__(self, framecount):
        self.framecount = framecount
        self.state = [0 for x in range(framecount)]
        self.freelist = []
        self.allocate_page = algo.allocate_page
        self.free_page = algo.free_page

    def __deepcopy__(self):
        mem = PhysicalMemory(self.framecount)
        mem.state = self.state[:]
        mem.freelist = self.freelist[:]
        mem.allocate_page = self.allocate_page
        mem.free_page = self.free_page
        return mem

    def get(self, addr):
        return self.state[addr]

    def set(self, addr, data):
        self.state[addr] = data

    def alloc(self, data):
        addr = self.allocate_page(self.freelist)
        try:
            self.state[addr] = data
        except IndexError:
            raise exceptions.AddressInvalid(f"Hardware error: memory panic @ {addr} (address doesn't exist)")
        return addr

    def free(self, addr):
        self.free_page(self.freelist, addr)
