import algorithms as algo
import exceptions


class Page:
    def __init__(self, uid, data, addr):
        self.uid = uid
        self.data = data
        self.addr = addr  # If addr is None, it is paged out onto disk


class PageManager:
    def __init__(self, mem):
        self.pages = []
        self.mem = mem
        self.uid_count = 0
        self.handle_pagefault = algo.handle_pagefault
        self.userstate = algo.initialize_pagemanager_state()

    def make_page(self, data):
        self.pages.append(Page(self.uid_count, data, self.mem.alloc(data)))
        self.uid_count += 1
        return self.pages[-1]

    def load_page(self, pageid):
        page = self.pages[pageid]
        page.addr = self.mem.alloc(page.data)

    def evict_page(self, pageid):
        page = self.pages[pageid]
        self.mem.free(page.addr)
        self.pages[pageid].addr = None

    def access_page(self, pageid):
        # Check if page exists
        if pageid >= len(self.pages):
            raise exceptions.PageDoesntExist(f"Page {pageid} doesn't exist.")
        return self.handle_pagefault(pageid, self.userstate, self.load_page, self.evict_page)
