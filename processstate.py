from enum import Enum


class ProcessState(Enum):
    NEW = 0
    READY = 1
    RUNNING = 2
    BLOCKED = 3
    EXIT = 4
    DONE = 5
