from processstate import ProcessState

### MEMORY ###

"""
Use the freelist to find an unallocated block of memory and return its address.
"""
def allocate_memory(freelist):
    if len(freelist) == 0:
        freelist.append(0)
        return 0
    else:
        last_addr = freelist[-1]
        freelist.append(last_addr + 1)
        return last_addr + 1

"""
Update the freelist so you know that you've freed this memory.
"""
def free_memory(freelist, addr):
    pass

### PAGE MANAGEMENT ###

"""
What the 'state' param in on_page_created() should look like initially.
Preferably only use Python built-in data types and list/set/dict.
"""
def initialize_pagemanager_state():
    return []

"""
Called after a page is created for the first time and its memory is allocated.
The intention is for you to update your 'state' to keep track of evictees.
"""
def on_page_created(pageid, state):
    state.append(pageid)

"""
Called when a page is no longer in use and its memory is freed.
"""
def on_page_freed(pageid, state):
    state.remove(pageid)

"""
When a process wishes to access data in a page, the page must loaded into memory.
If the page isn't in memory, this is a 'page fault', and the page manager must retrieve
the page from the disk and put it in memory. If memory is full, the page manager must choose
a page to evict.

:param pageid: The number of the page to access.
:param state: Your defined state. Must only use dicts, sets, lists and Python primitives.
:param evict_page: The function to call to evict a page. evict_page(pageid)
:param mem_size: How many pages can fit into memory at once.
"""
def handle_pagefault(pageid, state, evict_page, mem_size):
    if len(state) < mem_size:  # If there's free memory, just load
        return
    # otherwise, evict & load
    to_evict = state.pop(0)  # FIFO
    evict_page(to_evict)

### PROCESS SCHEDULING ###

def init_scheduler(scheduler):
    scheduler.q = []

def admit_process(scheduler, process):
    scheduler.q.append(process)

def pick_process(scheduler):
    for process in scheduler.q:
        if process.state == ProcessState.READY:
            return process
    return None

def terminate_process(scheduler, process):
    scheduler.q.remove(process)
