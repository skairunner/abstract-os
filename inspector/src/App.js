import React, { Component } from 'react';
import './App.css';
import RWebSocket from './RWebSocket';
import RelTrendline from './RelTrendline';
import OverviewChart from './OverviewChart';

// Only returns elements that occured up to time ms ago
function limit_by_time(source, time) {
  let end = source[source.length - 1].clock;
  let i = source.length - 2;
  for(; 0 < i; i--) {
    if (end - source[i].clock > time) {
      break;
    }
  }
  return source.slice(i);
}

const TIMEWINDOW = 10000;
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      steps: [],
      is_on: -1,
    }
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

  render() {
    let memdata = [], memtimerange = [0, 1];
    if (this.state.steps.length > 0) {
      const last_10s = limit_by_time(this.state.steps, TIMEWINDOW);
      memdata = last_10s.map(d => [d.clock, d.mem.in_use / d.mem.framecount]);
      let end = memdata[memdata.length - 1][0];
      memtimerange = [Math.max(0, end - TIMEWINDOW), Math.max(10000, end)];
    }
    return (
      <div className="App">
        <br/>
        <RelTrendline
          data={memdata}
          domain={memtimerange}
          width={100}
          height={50}
          padding_w={5}
          padding_h={5}
          caption='Memory used'/>
        <OverviewChart width={600} height={150} state={this.state.steps[this.state.is_on]} />
        <RWebSocket uri='ws://localhost:8765' onMessage={this.handleData}/>
      </div>
    );
  }
}

export default App;