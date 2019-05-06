## Installing

Ensure you have pipenv installed.

To install all dependencies:
```
$ pipenv install --dev
```

To test:
```
$ pipenv run pytest
```

To run:
```
$ pipenv run python run_sim.py <scenario_name>
```

To set a custom algorithm, set the envvar `AOS_ALGORITHMS` to the *module name* (no .py). E.g.:
```
$ AOS_ALGORITHMS=round_robin pipenv run python run_sim.py <scenario_name>
```
If the algorithm file isn amed `round_robin.py`.

The visualizer can be started in developer mode with the command:
```
../inspector $ yarn start
```
Yarn will start a server that watches the inspector directory, and a new tab will open in your default browser at localhost:3000.

The client can instead be built via `yarn build`, instead.
