class SimulatorException(Exception):
    pass


class AddressInvalid(SimulatorException):
    pass


class PageDoesntExist(SimulatorException):
    pass


class ProgramParsingException(SimulatorException):
    pass


class ProgramUnknownRun(SimulatorException):
    pass