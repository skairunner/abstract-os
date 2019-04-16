import React from 'react';
import * as d3scale from 'd3-scale';
import {Axis} from 'react-d3-axis';
import {get_rel_coords} from './utilities'
import './Timeline.css';

function get_tickvals(steps, n) {
  if (steps.length == 0) {
    return []
  }
  if (steps.length <= n) {
    return steps.map(d => d.clock);
  }
  let vals = [];
  for (let i = 0; i < n - 1; i++) {
    vals.push(steps[Math.floor(steps.length / (n - 1) * i)].clock);
  }
  vals.push(steps[steps.length - 1].clock);
  return vals;
}

function limit_range(v, a, b) {
  if (v < a) return a;
  if (v > b) return b;
  return v;
}

function binary_search_time(steps, clock) {
  let l = 0, r = steps.length - 1;
  while (l <= r) {
    const m = Math.floor((l + r)/2);
    const v = steps[m].clock;
    // otherwise keep binarying
    if (v < clock) {
      l = m + 1;
    } else if (v > clock) {
      r = m - 1;
    } else {
      return m;
    }
  }

  l = limit_range(l, 0, steps.length - 1);
  r = limit_range(r, 0, steps.length - 1);

  // Find the closer one
  if (Math.abs(steps[l].clock - clock) < Math.abs(steps[r].clock - clock)) {
    return l;
  } else {
    return r;
  }
}

export default function Timeline(props) {
  // Destructuring to set defaults for missing values
  const {
    padding_w = 15
  } = props;

  if (props.steps.length == 0) {
    return null;
  }

  const limitX = props.width - 2 * padding_w;
  // X scale to place sim steps according to time.
  const scaleX = d3scale.scaleLinear([0, props.steps[props.steps.length - 1].clock], [0, limitX]);
  let tickvals = get_tickvals(props.steps, 5);

  const callback = e => {
    if(e.buttons != 1) {
      return;
    }
    let x = get_rel_coords(e).x;
    x -= padding_w;
    if (x > limitX) x = limitX;
    let new_step = binary_search_time(props.steps, scaleX.invert(x) + .5);
    props.step_to(new_step);
  }

  return (
    <figure className='Timeline'>
      <svg width={props.width} height={props.height}>
        <g className='axis' transform={`translate(${padding_w}, ${props.height / 2})`}>
          <Axis position={scaleX} values={tickvals} range={[0, limitX]} format={d => `${Math.floor(d/100) / 10}s`} />
          <circle className='pip' r={5} cx={scaleX(props.this_step.clock)} cy={0} />
        </g>
        <rect className='clickable' width={props.width} height={props.height} onMouseMove={callback}/>
      </svg>
    </figure>
  )
}