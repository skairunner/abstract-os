import React from 'react';

// To aid in debugging Python algorithms

export default function Debug(props) {
  if (!props.state) {
    return null;
  }
  return (
    <div>
      <p>Freelist: {JSON.stringify(props.state.mem.freelist)}</p>
      <p>Total page faults: {props.state.pagemngr.ttl_faults}</p>
    </div>
  )
}