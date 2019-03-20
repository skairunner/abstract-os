from simulator import Memory, MallocGuard

def test_alloc_on_empty_memory():
    mem = Memory(100)
    mem.alloc(0, 50)
    assert mem.state == [(0, 50)]

def test_alloc_continuously():
    mem = Memory(100)
    mem.alloc(0, 10)
    mem.alloc(10, 20)

def test_empty_memory_is_not_occupied():
    mem = Memory(100)
    assert not mem.is_occupied(0, 50)

def test_memory_guard_counts_correctly():
    mem = Memory(100)
    with MallocGuard(50, mem):
        mem.alloc(0, 50)
