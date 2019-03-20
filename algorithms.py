"""
Given n units of memory to allocate and the MemoryState, return a list of tuples of
memory allocated.
"""
def allocate_memory(n, state):
    # First-free algorithm
    for i in range(state.size):
        if not state.is_occupied(i, n):
            state.alloc(i, n)
            return [(i, n)]
    # Give up
    return []
