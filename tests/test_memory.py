from memory import PhysicalMemory
import exceptions
import pytest

def simple_alloc(freelist):
    if len(freelist) == 0:
        freelist.append(0)
    else:
        freelist.append(freelist[-1] + 1)
    return freelist[-1]

def simple_free(freelist, addr):
    freelist.remove(addr)


def test_simple_alloc():
    mem = PhysicalMemory(10)
    mem.allocate_page = simple_alloc
    for i in range(5):
        mem.alloc(i + 1)
    assert mem.state == [1, 2, 3, 4, 5, 0, 0, 0, 0, 0]


def test_raises_address_out_of_bounds():
    mem = PhysicalMemory(1)
    mem.allocate_page = simple_alloc
    with pytest.raises(exceptions.AddressInvalid):
        for i in range(5):
            mem.alloc(i+1)

def test_simple_free():
    mem = PhysicalMemory(2)
    mem.allocate_page = simple_alloc
    mem.free_page = simple_free
    mem.alloc(1)
    mem.free(0)
    assert mem.freelist == []
