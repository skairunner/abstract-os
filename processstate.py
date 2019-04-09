from enum import Enum


class ProcessState(Enum):
    NEW = 'new'
    READY = 'ready'
    RUNNING = 'running'
    BLOCKED = 'blocked'
    EXIT = 'exit'
    DONE = 'done'
