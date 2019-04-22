import React from 'react';
import * as d3scale from 'd3-scale';
import './MemoryTimeline.css';

const THUMB_WIDTH = 25;

// A 'block' of memory history.
function MemoryTimelineBlock(props) {
  const w = THUMB_WIDTH + 2;
  const y = props.scaleY(props.data.start);
  const h = props.scaleY(props.data.end) - y;
  const x = props.data.addr * w;
  const thumbdim = props.render.thumbdim;
  return (
    <g className='MemoryTimelineBlock' transform={`translate(${x}, ${y})`}>
      <rect width={w} height={h} fill={props.render.color} />
      <image x={1} y={1} width={thumbdim.w} height={thumbdim.h} xlinkHref={props.render.thumburl} />
    </g>
  )
}

export default function MemoryTimeline(props) {
  if (props.mem_renders.length == 0) {
    return null;
  }
  let scaleY = d3scale.scaleLinear([0, props.clock], [0, props.clock / 4]);
  const blocks = props.mem_history.map((d, i) => (<MemoryTimelineBlock
    key={i}
    data={d}
    render={props.mem_renders[d.data]}
    scaleY={scaleY} />));
  return (
    <svg className='MemoryTimeline' width={props.width} height={props.height}>
      <g transform='translate(1, 1)'>{blocks}</g>
    </svg>
  )
}