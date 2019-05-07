import heapq

from processstate import ProcessState

### MEMORY ###

"""
You can initialize the freelist here, if you want to.
"""


def initialize_freelist(freelist, memsize):
    for x in range(memsize):
        freelist.append(x)


"""
Use the freelist to find an unallocated block of memory and return its address.
"""


def allocate_memory(freelist):
    return freelist.pop()


"""
Update the freelist so you know that you've freed this memory.
"""


def free_memory(freelist, addr):
    freelist.append(addr)


### PAGE MANAGEMENT ###

"""
What the 'state' param in on_page_created() should look like initially.
Preferably only use Python built-in data types and list/set/dict.
"""


def initialize_pagemanager_state():
    return []


"""
Called after a page is placed into memory.
The intention is for you to update your 'state' to keep track of evictees.
"""


def on_page_loaded(pageid, state):
    state.append(pageid)


"""
Called when a page's memory is freed, be it by evicting
or by being deallocated.
"""


def on_page_freed(pageid, state):
    try:
        state.remove(pageid)
    except:
        pass


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


def handle_pagefault(pageid, state, evict_page, mem_used, mem_size):
    if len(state) < mem_size:  # If there's free memory, just load
        return
    # otherwise, evict & load
    to_evict = state.pop(0)  # FIFO
    evict_page(to_evict)


### PROCESS SCHEDULING ###

def init_scheduler(scheduler):
    scheduler.pq = []
    scheduler.last = None


class Node:
    def __init__(self, process, priority):
        self.process = process
        self.priority = priority

    def __lt__(self, other):
        if self.priority < other.priority:
            return True
        else:
            return False


def admit_process(scheduler, process):
    priority = len(process.program)
    heapq.heappush(scheduler.pq, Node(process, priority))


def pick_process(scheduler):
    # for i, process in enumerate(scheduler.q):
    #     if process.state == ProcessState.READY:
    #         schedule_me = process
    #         break
    # return process
    schedule_me = None
    push_list = []

    for i in range(len(scheduler.pq)):
        node = heapq.heappop(scheduler.pq)
        push_list.append(node)
        if node.process.state == ProcessState.READY:
            schedule_me = node.process
            break
    for e in push_list:
        heapq.heappush(scheduler.pq, e)

    return schedule_me


def terminate_process(scheduler, process):
    for i, node in enumerate(scheduler.pq):
        if node.process == process:
            scheduler.pq.pop(i)
