import React, { Component } from 'react';
import './App.css';
import RWebSocket from './RWebSocket';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      steps: []
    }
  }

  handleData = (event) => {
    let r = JSON.parse(event.data);
    this.setState(oldstate => {
      oldstate.steps.push(r);
      return oldstate;
    })
  }

  render() {
    return (
      <div className="App">
        <RWebSocket uri='ws://localhost:8765' onMessage={this.handleData}/>
      </div>
    );
  }
}

export default App;