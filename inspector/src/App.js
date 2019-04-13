import React, { Component } from 'react';
import './App.css';
import ReconnectingWebSocket from 'reconnecting-websocket';

class RWebSocket extends Component {
  constructor(props) {
    super(props);
    this.rws = new ReconnectingWebSocket(props.uri);
    if (props.onOpen) {
      this.rws.addEventListener('open', props.onOpen);
    }
    if (props.onClose) {
      this.rws.addEventListener('close', props.onClose);
    }
    if (props.onMessage) {
      this.rws.addEventListener('message', props.onMessage);
    }
  }

  render() {
    return null
  }
}

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