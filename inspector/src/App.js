import React, { Component } from 'react';
import { HotKeys } from "react-hotkeys";
import ReconnectingWebSocket from 'reconnecting-websocket';
import './App.css';
import Debug from './DebugView';
import Trendline from './Trendlines';
import OverviewChart from './OverviewChart';
import Timeline from './Timeline';
import { arrmax, arrsum } from './utilities';

// Only returns elements that occured up to time ms ago
function limit_by_time(source, time) {
  if (source.length === 0) {
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

// Calculate a rolling average of the values with the given window size.
// Values are tuples of [timestamp, value]. 
function rolling_average(values, window) {
  if (values.length < window) {
    return []
  }
  let valsum = 0;
  let timesum = 0;
  let out = []
  for (let i = 0; i < values.length - window; i++) {
    for (let n = 0; n < window; n++) {
      timesum += values[i + n][0];
      valsum += values[i + n][1];
    }
    out.push([timesum / window, valsum / window]);
    timesum = 0;
    valsum = 0;
  }
  return out;
}

/**
 * Divides source into buckets of time. If a step is on the limit between two 
 * buckets, it'l be divided depending on how much on the line it is.
 * @param {list} source 
 * @param {number} time 
 * @param {fn(datum) => value} transform - Applied to each element to extract the value returned
 * @param {fn(values) => value} callback - Provided a list of adjusted values to apply to each bucket.
 * @returns List of [time, value] for each time bucket.
 */
function batch_steps(source, time, transform, callback) {
  // sum: time sum
  let sum = 0, out = [[0, 0]], temp = [];
  for(let el of source) {
    if (sum + el.time > time) {
      const frac = (time - sum) / time;
      temp.push(transform(el) * frac);
      // Pop and add to results
      const timestamp = time * out.length;
      out.push([timestamp, callback(temp)])
      // Finally, add the remainder of the el value to temps
      temp = [transform(el) * (1 - frac)];
      sum = sum + el.time - time; // Also reset time sum
    } else {
      // Otherwise just add to the temp array
      sum += el.time;
      temp.push(transform(el));
    }
  }
  // If there's anything left in temp, modify it and add to end
  if (temp.length !== 0) {
    let frac = sum / time;
    const timestamp = time * (out.length - 1 + frac);
    const adjval = sum === 0 ? 0 : callback(temp) / frac;
    out.push([timestamp, adjval]);
  }
  return out;
}

const keyMap = {
  FORWARD: 'right',
  BACKWARD: 'left',
  FORWARD_FIVE: 'shift+right',
  BACKWARD_FIVE: 'shift+left',
  TO_END: ['command+right', 'ctrl+right'],
  TO_START: ['command+left', 'ctrl+left'],
}
const TIMEWINDOW = 10000; // the range of time to show in the trendlines
const TIMEBUCKET = 200; // the granularity of time
const ROLLING_WINDOW = 5;

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

  // Process data only once per step, if possible
  preprocessData = (steps, step) => {
    // Memory graph
    let memdata = [], memtimerange = [0, 1];

    const last_10s = limit_by_time(steps, TIMEWINDOW);
    memdata = last_10s.map(d => [d.clock, d.mem.in_use / d.mem.framecount]);
    let end = memdata[memdata.length - 1][0];
    memtimerange = [Math.max(0, end - TIMEWINDOW), Math.max(10000, end)];
    // Only does 10s of data.
    step.memdata = memdata;
    step.memtimerange = memtimerange;

    // Page faults
    const faultdata = batch_steps(last_10s, TIMEBUCKET, d => d.pagemngr.faults, ds => arrsum(ds));
    const faultmax = arrmax(faultdata, d => d[1])[1];
    step.faultrange = [0, faultmax == 0 ? 1 : faultmax];
    end = faultdata[faultdata.length - 1][0];
    // assign rolling average
    step.faultdata = rolling_average(faultdata, ROLLING_WINDOW);
    step.faulttimerange = [Math.max(0, end - TIMEWINDOW), Math.max(10000, end)];
  }

  handleData = (event) => {
    let results = JSON.parse(event.data);
    this.setState(oldstate => {
      let state = {...oldstate};
      state.steps = oldstate.steps.slice(0);
      for (let step of results) {
        step.pagemngr.pages = step.pagemngr.pages.filter(d => !d.freed);
        // Process data
        state.steps.push(step);
        this.preprocessData(state.steps, step);
      }
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

    const handlers = {
      FORWARD: e => this.do_step(1),
      BACKWARD: e => this.do_step(-1),
      FORWARD_FIVE: e => this.do_step(5),
      BACKWARD_FIVE: e => this.do_step(-5),
      TO_START: e => this.step_to(0),
      TO_END: e => this.step_to(this.state.steps.length - 1)
    }

    if (this.state.is_on < 0) {
      return (
        <div className='App'>
          Attempting to connect to server...
        </div>
      )
    }

    const TRENDLINE_OPTS = {
      width: 100,
      height: 50,
      padding_w: 5,
      padding_h: 5
    };

    const this_step = this.state.steps[this.state.is_on];

    return (
      <div className="App">
        <HotKeys keyMap={keyMap} handlers={handlers}>
          <span>Step: {this.state.is_on}</span>
          <div class='trendlines'>
            <Trendline
              data={this_step.memdata}
              domain={this_step.memtimerange}
              {...TRENDLINE_OPTS}
              unit='%'
              caption='Memory used'/>
            <Trendline
              data={this_step.faultdata}
              domain={this_step.faulttimerange}
              valdomain={this_step.faultrange}
              {...TRENDLINE_OPTS}
              unit='/s'
              caption='Page faults'
              absolute/>
          </div>
          <OverviewChart width={600} height={600} state={this_step} />
          <Timeline
            steps={this.state.steps}
            width={600}
            height={40}
            this_step={this.state.steps[this.state.is_on]}
            step_to={this.step_to} />
          <Debug state={this_step} />
        </HotKeys>
      </div>
    );
  }
}

export default App;