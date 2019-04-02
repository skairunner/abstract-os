"""
Use the freelist to find an unallocated block of memory and return its address.
"""
def allocate_page(freelist):
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
def free_page(freelist, addr):
    pass

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
