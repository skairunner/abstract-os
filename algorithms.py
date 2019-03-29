def allocate_page(freelist):
    return 0

def free_page(freelist, addr):
    pass

def initialize_pagemanager_state():
    return []

"""
When a process wishes to access data in a page, the page must loaded into memory.
If the page isn't in memory, this is a 'page fault', and the page manager must retrieve
the page from the disk and put it in memory. If memory is full, the page manager must choose
a page to evict.

:param pageid: The number of the page to access.
:param state: Your defined state. Must only use dicts, sets, lists and Python primitives.
:param load_page: The function to call to load a page. load_page(pageid)
:param evict_page: The function to call to evict a page. evict_page(pageid)

:returns: The address of the newly-loaded page.
"""
def handle_pagefault(pageid, state, load_page, evict_page):
    return None
