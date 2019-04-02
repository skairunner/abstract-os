import algorithms as algo
from copy import deepcopy
import exceptions


class Page:
    def __init__(self, uid, addr):
        self.uid = uid
        self.addr = addr  # If addr is None, it is paged out onto disk

    def __deepcopy__(self):
        return Page(self.uid, self.addr)


class PageManager:
    """
    :param mem: a PhysicalMemory for the PageManager to use.
    """
    def __init__(self, mem):
        self.pages = []
        self.slots = {}  # Where data will be evicted to.
        self.mem = mem
        self.uid_count = 0
        self.handle_pagefault = algo.handle_pagefault
        self.on_page_created = algo.on_page_created
        self.userstate = algo.initialize_pagemanager_state()

    def __deepcopy__(self):
        pm = PageManager(deepcopy(self.mem))
        pm.pages = deepcopy(self.pages)
        pm.slots = deepcopy(self.slots)
        pm.uid_count = self.uid_count
        pm.handle_pagefault = self.handle_pagefault
        pm.on_page_created = self.on_page_created
        return pm

    def make_page(self, data):
        # Create a new page and return the Page object.
        pageid = self.uid_count
        self.uid_count += 1
        # Create the page itself
        self.pages.append(Page(pageid, None))
        # Ensure there is space in memory
        self.handle_pagefault(pageid, self.userstate, self.evict_page, self.mem.framecount)
        # Insert the page into memory
        self.load_page(pageid, new=True)
        self.mem.set(self.pages[-1].addr, data)
        # Report page creation to the page manager algorithm
        self.on_page_created(pageid, self.userstate)
        return self.pages[-1]

    def load_page(self, pageid, new=False):
        # Load a page from disk.
        if new:
            data = 0
        else:
            data = self.slots[pageid]
            del self.slots[pageid]
        page = self.pages[pageid]
        page.addr = self.mem.alloc(data)
        return page.addr

    def evict_page(self, pageid):
        # Evict a page to the disk, storing its contents in a slot
        page = self.pages[pageid]
        self.slots[pageid] = self.mem.get(page.addr)
        self.mem.free(page.addr)
        self.pages[pageid].addr = None

    def access_page(self, pageid):
        # Get the address of a page. If the page isn't loaded, attempt to load it.
        # Check if page exists
        if pageid >= len(self.pages):
            raise exceptions.PageDoesntExist(f"Page {pageid} doesn't exist.")
        if self.pages[pageid].addr is None:
            self.handle_pagefault(pageid, self.userstate, self.evict_page, self.mem.framecount)
            self.load_page(pageid)
        return self.pages[pageid].addr
