from memory import PhysicalMemory
from page import PageManager


def test_make_page():
    mem = PhysicalMemory(1)
    pm = PageManager(mem)
    page = pm.make_page(32)
    assert pm.mem.get(page.addr) == 32
