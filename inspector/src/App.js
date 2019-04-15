import React, { Component } from 'react';
import { HotKeys } from "react-hotkeys";
import ReconnectingWebSocket from 'reconnecting-websocket';
import './App.css';
import RelTrendline from './RelTrendline';
import OverviewChart from './OverviewChart';

// Only returns elements that occured up to time ms ago
function limit_by_time(source, time) {
  if (source.length == 0) {
    return [];
  }
  let end = source[source.length - 1].clock;
  let i = source.length - 2;
  for(; 0 < i; i--) {
    if (end - source[i].clock > time) {
      break;
    }
  }
  return source.slice(i);
}

const keyMap = {
  FORWARD: 'right',
  BACKWARD: 'left',
  FORWARD_FIVE: 'shift+right',
  BACKWARD_FIVE: 'shift+left',
  TO_END: ['command+right', 'ctrl+right'],
  TO_START: ['command+left', 'ctrl+left'],
}
const TIMEWINDOW = 10000;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      steps: [],
      is_on: -1,
    }
    this.rws = new ReconnectingWebSocket('ws://localhost:8765');
    this.rws.addEventListener('message', this.handleData);
  }

  handleData = (event) => {
    let results = JSON.parse(event.data);
    this.setState(oldstate => {
      let state = {...oldstate};
      state.steps = state.steps.concat(results);
      state.steps.sort(d => d.clock)
      state.is_on = state.steps.length - 1;
      return state;
    })
  }

  do_step = (n) => {
    if (n > 0) {
      if (this.state.is_on + n >= this.state.steps.length) {
        // If we're already on the last step, ask server to do new step(s)
        n = this.state.is_on + n - this.state.steps.length + 1;
        this.rws.send(`{"steps": ${n}}`);
      } else {
        // Otherwise advance the state.
        this.setState(oldstate => ({
          ...oldstate,
          is_on: oldstate.is_on + n
        }));
      }
    } else {
      // Going backwards now...
      this.setState(oldstate => ({
        ...oldstate,
        is_on: Math.max(0, oldstate.is_on + n)
      }));
    }
  }

  step_to = (n) => {
    if (0 <= n && n < this.state.steps.length) {
      this.setState(oldstate => ({...oldstate, is_on: n}))
    }
  }

  render() {
    let memdata = [], memtimerange = [0, 1];

    if (this.state.steps.length > 0) {
      const last_10s = limit_by_time(this.state.steps.slice(0, this.state.is_on), TIMEWINDOW);
      memdata = last_10s.map(d => [d.clock, d.mem.in_use / d.mem.framecount]);
      let end = memdata.length == 0 ? 0 : memdata[memdata.length - 1][0];
      memtimerange = [Math.max(0, end - TIMEWINDOW), Math.max(10000, end)];
    }

    const handlers = {
      FORWARD: e => this.do_step(1),
      BACKWARD: e => this.do_step(-1),
      FORWARD_FIVE: e => this.do_step(5),
      BACKWARD_FIVE: e => this.do_step(-5),
      TO_START: e => this.step_to(0),
      TO_END: e => this.step_to(this.state.steps.length - 1)
    }

    return (
      <div className="App">
        <HotKeys keyMap={keyMap} handlers={handlers}>
          <span>Step: {this.state.is_on}</span>
          <br/>
          <RelTrendline
            data={memdata}
            domain={memtimerange}
            width={100}
            height={50}
            padding_w={5}
            padding_h={5}
            caption='Memory used'/>
          <OverviewChart width={600} height={600} state={this.state.steps[this.state.is_on]} />
        </HotKeys>
      </div>
    );
  }
}

export default App;