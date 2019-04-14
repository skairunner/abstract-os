import React from 'react';
import * as d3scale from 'd3-scale';
import * as palettes from 'd3-scale-chromatic';
import './OverviewChart.css';

function Frame(props) {
  const x = props.memory_scale(props.addr);
  const w = props.memory_scale(props.addr + 1) - x - 1;
  const fill = props.data == 0 ? '#000' : palettes.schemeSet3[props.data % 12];
  return (
    <g transform={`translate(${x}, 0)`}>
      <rect className='Frame' width={w} height={props.height} fill={fill} />
      <text x={w / 2} y={5} dy='50%' fill='white' textAnchor='middle'>{props.data}</text>
    </g>
  )
}

function MemoryBar(props) {
  const frames = props.mem.memory.map((d, i) => (
    <Frame
      key={i}
      data={d}
      addr={i}
      height={props.height}
      memory_scale={props.memory_scale}/>
  ));
  return (
    <g className='memory_bar'>
      {frames}
    </g>
  )
}

export default function OverviewChart(props) {
  // Destructuring to set defaults for missing values
  const {
    padding_h = 0,
    padding_w = 0
  } = props;

  const state = props.state;
  if (!state) {
    return null;
  }

  const limitX = props.width - 2 * padding_w;
  const limitY = props.height - 2 * padding_h;
  const memory_scale = d3scale.scaleLinear([0, state.mem.framecount], [0, limitX]);

  return (
    <svg width={props.width} height={props.height}>
      <MemoryBar mem={state.mem} memory_scale={memory_scale} height={limitY} />
    </svg>
  )
}