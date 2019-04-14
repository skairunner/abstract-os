import React, { Component } from 'react';
import './App.css';
import RWebSocket from './RWebSocket';
import RelTrendline from './RelTrendline';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      steps: []
    }
  }

  handleData = (event) => {
    let results = JSON.parse(event.data);
    this.setState(oldstate => {
      let state = {...oldstate};
      state.steps = state.steps.concat(results);
      state.steps.sort(d => d.clock)
      return state;
    })
  }

  render() {
    return (
      <div className="App">
        <br/>
        <RelTrendline
          data={[0.1, 0.4, 0.3, 0.6, 0, 0.2]}
          width={100}
          height={50}
          padding_w={5}
          padding_h={5}
          caption='Test'/>
        <RWebSocket uri='ws://localhost:8765' onMessage={this.handleData}/>
      </div>
    );
  }
}

export default App;