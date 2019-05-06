import React from 'react';

// To aid in debugging Python algorithms

export default function Debug(props) {
  if (!props.state) {
    return null;
  }
  return (
    <div width={props.width}>
      <p style={{width: props.width + 'px'}}>Freelist: {props.state.mem.freelist.join(', ')}</p>
      <p>Total page faults: {props.state.pagemngr.ttl_faults}</p>
    </div>
  )
}