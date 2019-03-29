import algorithms as algo
import exceptions

class PhysicalMemory:
    def __init__(self, framecount):
        self.framecount = framecount
        self.state = [0 for x in range(framecount)]
        self.freelist = []
        self.allocate_page = algo.allocate_page
        self.free_page = algo.free_page

    def alloc(self, data):
        addr = self.allocate_page(self.freelist)
        try:
            self.state[addr] = data
        except IndexError:
            raise exceptions.AddressInvalid(f"Hardware error: memory panic @ {addr} (address doesn't exist)")
        return addr

    def free(self, addr):
        self.free_page(self.freelist, addr)


class Page:
    def __init__(self, data, addr):
        self.data = data
        self.addr = addr
