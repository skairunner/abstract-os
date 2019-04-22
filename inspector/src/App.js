import React, { Component } from 'react';
import { HotKeys } from "react-hotkeys";
import ReconnectingWebSocket from 'reconnecting-websocket';
import './App.css';
import Debug from './DebugView';
import Gantt from './Gantt';
import Trendline from './Trendlines';
import OverviewChart from './OverviewChart';
import MemoryTimeline from './MemoryTimeline';
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

// Divide memory info over time into continuous blocks for memory timeline
function batch_memory(steps) {
  let addrs = steps[0].mem.memory.map((d, i) => [{
    data: d,
    start: 0,
    end: steps[0].clock,
    addr: i
  }]);
  let flattened = addrs.flat();
  if (steps.length == 1) {
    return flattened;
  }
  for (let step of steps.slice(1)) {
    step.mem.memory.forEach((d, i) => {
      const last = addrs[i][addrs[i].length - 1];
      if (last.data == d) {
        last.end = step.clock;
      } else {
        // Otherwise make a new block
        const block = {
          data: d,
          start: last.end,
          end: step.clock,
          addr: i
        }
        addrs[i].push(block);
        flattened.push(block);
      }
    });
  }
  return flattened;
}

const keyMap = {
  FORWARD: 'right',
  BACKWARD: 'left',
  FORWARD_FIVE: 'shift+right',
  BACKWARD_FIVE: 'shift+left',
  TO_END: ['command+right', 'ctrl+right'],
  TO_START: ['command+left', 'ctrl+left'],
}
const TIMEWINDOW = 5000; // the range of time to show in the trendlines
const TIMEBUCKET = 200; // the granularity of time
const ROLLING_WINDOW = 5;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      steps: [],
      is_on: -1,
      width: 600,
      height: 600
    }
    this.rws = new ReconnectingWebSocket('ws://localhost:8765');
    this.rws.addEventListener('message', this.handleData);
    this.mem_renders = {};
  }

  updateDimensions = () => {
    this.setState(oldstate => ({...oldstate, width: window.innerWidth, height: window.innerHeight }));
  }

  // Process data only once per step, if possible
  preprocessData = (steps, step) => {
    // Memory graph
    let memdata = [], memtimerange = [];

    const last_10s = limit_by_time(steps, TIMEWINDOW);
    memdata = last_10s.map(d => [d.clock, d.mem.in_use / d.mem.framecount]);
    let end = memdata[memdata.length - 1][0];
    memtimerange = [Math.max(0, end - TIMEWINDOW), Math.max(10000, end)];
    // Only does 10s of data.
    step.memdata = memdata;
    step.memtimerange = memtimerange;

    // Process memory info for memory timeline
    step.mem_history = batch_memory(steps);

    // Page faults
    const faultdata = batch_steps(last_10s, TIMEBUCKET, d => d.pagemngr.faults, ds => arrsum(ds));
    const faultmax = arrmax(faultdata, d => d[1])[1];
    step.faultrange = [0, faultmax == 0 ? 1 : faultmax];
    end = faultdata[faultdata.length - 1][0];
    // assign rolling average
    step.faultdata = rolling_average(faultdata, ROLLING_WINDOW);
    step.faulttimerange = [Math.max(0, end - TIMEWINDOW), Math.max(TIMEWINDOW, end)];

    // Also save last 1s for Gantt
    step.last_1s = limit_by_time(steps, 1000);
  }

  handleData = (event) => {
    let results = JSON.parse(event.data);
    for (let step of results) {
      this.setState(oldstate => {
        let state = {...oldstate};
        state.steps = oldstate.steps.slice(0);
        step.pagemngr.pages = step.pagemngr.pages.filter(d => !d.freed);
        // Process data
        state.steps.push(step);
        this.preprocessData(state.steps, step);
        state.steps.sort((d1, d2) => d1.clock - d2.clock)
        state.is_on = state.steps.length - 1;
        return state;
      })
    }
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

  componentWillMount = () => {
    this.updateDimensions();
  }

  componentDidMount = () => {
    window.addEventListener('resize', this.updateDimensions);
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
    const OVERVIEW_HEIGHT = Math.max(this.state.height * .7 - 150, 200);

    return (
      <div className="App">
        <HotKeys keyMap={keyMap} handlers={handlers}>
          <span className='step'>Step: {this.state.is_on} /</span>
          <span className='clock'>Clock: {this.state.steps[this.state.is_on].clock}ms</span>
          <Timeline
            steps={this.state.steps}
            width={800}
            height={40}
            this_step={this.state.steps[this.state.is_on]}
            step_to={this.step_to} />
          <div className='trendlines'>
            <Trendline
              data={this_step.memdata}
              domain={this_step.memtimerange}
              {...TRENDLINE_OPTS}
              unit='%'
              stroke='#9528b4'
              caption='Memory used'/>
            <Trendline
              data={this_step.faultdata}
              domain={this_step.faulttimerange}
              valdomain={this_step.faultrange}
              {...TRENDLINE_OPTS}
              unit='/s'
              stroke='#4da60c'
              caption='Page faults'
              absolute />
          </div>
          <div className='columns'>
            <div className='main_container col'>
              <OverviewChart width={800} padding_left={24} height={OVERVIEW_HEIGHT} state={this_step} mem_renders={this.mem_renders} />
              <Gantt width={800} height={50} steps={this_step.last_1s} />
              <Debug state={this_step} />
            </div>
            <div className='memtimeline_container col'>
              <MemoryTimeline
                key={this.state.is_on}
                width={25 * this_step.mem.memory.length + 25}
                height={OVERVIEW_HEIGHT}
                clock={this_step.clock}
                framecount={this_step.mem.framecount}
                mem_renders={this.mem_renders}
                mem_history={this_step.mem_history} />
            </div>
          </div>
        </HotKeys>
      </div>
    );
  }
}

export default App;