from memory import PhysicalMemory
from page import PageManager
from process import Process, load_program, Operation
from processstate import ProcessState
import os


def test_load_program():
    program = load_program('../programs/100work.process')
    assert len(program) == 1
    op, a1, a2 = program[0]
    assert op == Operation.WORK
    assert a1 == 100


def test_process_run():
    mem = PhysicalMemory(1)
    pm = PageManager(mem)
    proc = Process(pm, '../programs/100work.process', 1)
    proc.run(90)
    assert proc.unfinished_work == 90
    proc.run(10)
    assert proc.state == ProcessState.EXIT

def test_process_run_two_segments():
    mem = PhysicalMemory(1)
    pm = PageManager(mem)
    proc = Process(pm, '../programs/two_fifties.process', 1)
    proc.run(100)
    assert proc.state == ProcessState.EXIT
    assert proc.program_counter == 2


# def test_process_execution():
#     pass


# def test_process_resource():
#     pass


# def test_process_states():
#     pass
