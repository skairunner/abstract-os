import React from 'react';
import * as d3scale from 'd3-scale';
import * as palettes from 'd3-scale-chromatic';
import './OverviewChart.css';

function Frame(props) {
  const x = props.memory_scale(props.addr);
  const w = props.memory_scale(props.addr + 1) - x - 1;
  const fill = props.data === 0 ? '#000' : palettes.schemeSet3[props.data % 12];
  return (
    <g transform={`translate(${x}, 0)`}>
      <rect className='Frame' width={w} height={props.height} fill={fill} />
      <text x={w / 2} y={props.height / 2} fill='white' textAnchor='middle'>{props.data}</text>
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

function Page(props) {
  return (
    <g className='Page'>
      <rect />
    </g>
  )
}

function Process(props) {
  let x = props.scale(props.process.pid);
  let width = props.scale.bandwidth();
  return (
    <g className='Process' transform={`translate(${x}, 0)`}>
      <rect width={width} height={props.height} />
      <text x={3} y={18}>{props.process.name}</text>
      <text x={3} y={36}>pid: {props.process.pid}</text>
    </g>
  )
}

function ProcessesPages(props) {
  // First define process's band. Divide horizontal space into minimum 5 areas.
  const domain = props.processes.map(d => d.pid);
  if (domain.length < 5) {
    for (let i = 5 - domain.length; 0 < i; i--) {
      domain.push(`invalid${i}`);
    }
  }
  const process_scale = d3scale
    .scaleBand(domain, props.memory_scale.range())
    .paddingInner(0.05);
  const procs = props.processes.map(d => (
    <Process key={d.pid} height={props.height} process={d} scale={process_scale} />
  ))
  const pages = props.pagemngr.pages.map((d, i) => (
    <Page key={i} />
  ))
  return (
    <g transform={`translate(0, ${props.y})`}>
      {pages}
      {procs}
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
      <MemoryBar mem={state.mem} memory_scale={memory_scale} height={limitY / 4} />
      <ProcessesPages
        processes={state.scheduler.processes}
        height={limitY / 4}
        pagemngr={state.pagemngr}
        memory_scale={memory_scale}
        y={limitY / 4 * 1.1} />
    </svg>
  )
}