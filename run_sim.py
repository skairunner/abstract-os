from collections import defaultdict
from copy import deepcopy
import json
from simulator import Simulation
import sys
import random
import toml

class Run:
    def __init__(self, name=None, script=None, offset=0):
        self.name = name
        self.script = script
        self.offset = offset
        self.count = 0

    def next(self):
        return None

class RunOnce(Run):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

class RunEvery(Run):
    def __init__(self, interval=None, limit=None, **kwargs):
        if interval is None:
            raise ValueError('You must provide an interval to RunEvery.')
        self.interval = interval
        self.limit = limit
        super().__init__(**kwargs)

    def next(self):
        if self.limit is None or self.count < self.limit:
            t = self.offset + self.interval * self.count
            self.count += 1
            return t
        return None

class RunRand(Run):
    def __init__(self, minimum=None, maximum=None, limit=None, **kwargs):
        if minimum is None:
            raise ValueError('You must provide a minimum for RunRand.')
        if maximum is None:
            raise ValueError('You must provide a maximum for RunRand.')
        if minimum > maximum:
            raise ValueError('Minimum is larger than maximum for RunRand.')
        self.minimum = minimum
        self.maximum = maximum
        self.limit = limit
        super().__init__(**kwargs)
        self.ticksum = self.offset  # Make it possible to track when the next time is

    # Increment the count and return what the next index should be. None if no more.
    def next(self):
        if self.limit is None or self.count < self.limit:
            self.ticksum += random.randint(self.minimum, self.maximum)
            self.count += 1
            return self.ticksum
        return None

"""
A Scenario loads a simulator scenario from a file. It is immutable.
"""
class Scenario:
    def __init__(self, name):
        with open(f'scenarios/{name}.toml') as f:
            data = toml.load(f)
        self.name = name
        self.memory = data['system']['memory']
        self.run_once, self.run_every, self.run_rand = [], [], []
        if 'run_once' in data:
            self.run_once = [RunOnce(**x) for x in data['run_once']]
        if 'run_every' in data:
            self.run_every = [RunEvery(**x) for x in data['run_every']]
        if 'run_rand' in data:
            self.run_rand = [RunRand(**x) for x in data['run_rand']]

"""
A ScenarioInstance has state. Using a Scenario, it builds a Simulation that will run with the given parameters.
"""
class ScenarioInstance:
    def __init__(self, scenario):
        self.scenario = deepcopy(scenario)

        # Insert all run_once. For every/rand, insert the next copy and insert a new one when popping it.
        insertbuffer = defaultdict(list)
        for run in self.scenario.run_once:
            insertbuffer[run.offset].append(run)
        for run in self.scenario.run_every:
            t = run.next()
            if t is not None:
                insertbuffer[t].append(run)
        for run in self.scenario.run_rand:
            t = run.next()
            if t is not None:
                insertbuffer[t].append(run)

        self.insertbuffer = insertbuffer
        self.simulation = Simulation(memorysize=scenario.memory)

    def serialized(self, count=1, isUpdate=True):
        history = []
        if count > 1:
            history = [x.serialize() for x in self.simulation.history[-count + 1:]]
        history.append(self.simulation.current.serialize())
        obj = {'type': 'update' if isUpdate else 'new', 'history': history}
        return json.dumps(obj)

    def step(self, steps):
        for i in range(steps):
            t = self.simulation.current.clock
            # Find new processes, if needed, and insert
            to_pop = []
            for key in sorted(self.insertbuffer.keys()):
                # 'catch up' on missed process spawns
                if key > t:
                    break
                processes = self.insertbuffer[key]
                to_pop.append(key)
                for process in processes:
                    # Spawn process
                    self.simulation.spawn_process(process)
                    # If need to add more, queue up.
                    next_t = process.next()
                    if next_t is not None:
                        self.insertbuffer[next_t].append(process)
            for key in to_pop:
                del self.insertbuffer[key]
            # Advance simulation
            self.simulation.step()


if __name__ == '__main__':
    import websockets
    import asyncio

    async def listen(websocket, path):
        sim = ScenarioInstance(Scenario(sys.argv[1]))
        await websocket.send(sim.serialized(isUpdate=False))
        async for message in websocket:
            data = json.loads(message)
            steps = data['steps']
            sim.step(steps)
            await websocket.send(sim.serialized(steps))

    asyncio.get_event_loop().run_until_complete(
        websockets.serve(listen, 'localhost', 8765))

    asyncio.get_event_loop().run_forever()
