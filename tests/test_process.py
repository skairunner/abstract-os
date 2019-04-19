from memory import PhysicalMemory
from page import PageManager
from process import Process, load_program_to_process
from processstate import ProcessState
import os


def test_create_process():
    mem = PhysicalMemory(1)
    pm = PageManager(mem)
    print(os.getcwd())
    proc = load_program_to_process('../programs/prog1', pm, 1)
    assert proc


def test_process_run():
    mem = PhysicalMemory(1)
    pm = PageManager(mem)
    proc = load_program_to_process('../programs/prog1', pm, 1)
    proc.run(90)
    assert proc.workdone == 90
    proc.run(10)
    # proc.run(1)
    assert proc.workdone == 100
    # assert proc.state == ProcessState.EXIT


# def test_process_execution():
#     pass


# def test_process_resource():
#     pass


# def test_process_states():
#     pass
