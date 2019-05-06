class SimulatorException(Exception):
    pass


class AddressInvalid(SimulatorException):
    pass


class PageDoesntExist(SimulatorException):
    pass


class ProgramException(SimulatorException):
    scriptname = None
    varname = None
    linenum = None

    def __init__(self, msg, *args, **kwargs):
        self.scriptname = kwargs.pop('script', None)
        self.linenum = kwargs.pop('line', None)
        msg = f"[{self.scriptname}:{self.linenum + 1}] {msg}"
        super().__init__(msg, *args)

class ProgramParsingException(ProgramException):
    pass

class ProgramUnknownRun(ProgramException):
    pass

class ProgramWriteBeforeMalloc(ProgramException):
    def __init__(self, *args, **kwargs):
        self.varname = kwargs.pop('varname', None)
        msg = f"Attempted to write to '{self.varname}' before it was allocated."
        super().__init__(msg, *args, **kwargs)

class ProgramReadBeforeMalloc(ProgramException):
    def __init__(self, *args, **kwargs):
        self.varnum = kwargs.pop('varname', None)
        msg = f"Attempted to read '{self.varname}' before it was allocated."
        super().__init__(msg, *args, **kwargs)

class ProgramFreeBeforeMalloc(ProgramException):
    def __init__(self, *args, **kwargs):
        self.varnum = kwargs.pop('varname', None)
        msg = f"Attempted to free '{self.varname}' before it was allocated."
        super().__init__(msg, *args, **kwargs)
