class SimulatorException(Exception):
    pass


class AddressInvalid(SimulatorException):
    pass


class PageDoesntExist(SimulatorException):
    pass
