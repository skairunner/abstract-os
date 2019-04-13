import React, { Component } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

export default class RWebSocket extends Component {
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