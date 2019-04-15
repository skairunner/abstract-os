import React from 'react';
import * as d3scale from 'd3-scale';
import * as palettes from 'd3-scale-chromatic';
import proportionalScale from './ProportionalScale';
import './OverviewChart.css';

function Frame(props) {
  const x = props.memory_scale(props.addr) + 1;
  const w = props.memory_scale(props.addr + 1) - x - 2;
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
  let x = props.scale(props.page.uid);
  let w = props.scale.bandwidth();
  return (
    <g className='Page' transform={`translate(${x}, 0)`}>
      <rect width={w} height={props.height}/>
      <text x={3} y={18}>{props.page.uid}</text> 
    </g>
  )
}

function Process(props) {
  let x = props.scale(props.process.pid);
  let width = props.scale.bandwidth(props.process.pid);
  return (
    <g className='Process' transform={`translate(${x}, 0)`}>
      <rect width={width} height={props.height} />
      <text x={3} y={18}>{props.process.name}</text>
      <text x={3} y={36}>pid: {props.process.pid}</text>
    </g>
  )
}

function Pages(props) {
  const pages = props.pagemngr.pages.map((d, i) => (
    <Page key={i} page={d} scale={props.page_scale} height={props.height / 2} />
  ))
  return (
    <g className='Pages' transform={`translate(0, ${props.y})`}>
      {pages}
    </g>
  )
}

function Processes(props) {
  const procs = props.processes.map(d => (
    <Process key={d.pid} height={props.height / 2} process={d} scale={props.process_scale} />
  ))

  return (
    <g className='Processes' transform={`translate(0, ${props.y})`}>
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
  const processes = state.scheduler.processes;

  const limitX = props.width - 2 * padding_w;
  const limitY = props.height - 2 * padding_h;
  const memory_scale = d3scale.scaleLinear([0, state.mem.framecount], [0, limitX]);

  // First define process's band. Divide horizontal space into minimum 5 areas.
  let processdomain = processes.map(d => [d.pid, d.pages.length]);
  const processcount = processes.reduce((a, d) => a + d.pages.length, 0)
  if (processcount < 5) {
    processdomain.push([`placeholder`, 5 - processcount]);
  }
  const process_scale = proportionalScale(processdomain, memory_scale.range()).paddingInner(0.05);

  // Next, determine the scale of the pages.
  // Pages are located near the first process that 'owns' it. Essentially,
  // sort the pages by the first process that claims it.
  let page_uids = [];
  let did_put_page = new Set();
  for (let process of processes) {
    for (let pageid of process.pages) {
      if (!did_put_page.has(pageid)) {
        did_put_page.add(pageid);
        page_uids.push(pageid);
      }
    }
  }
  // Add extra pages if needed, to have a minimum block width
  for (let i = 0; i <= 5 - page_uids.length; i++) {
    page_uids.push('placeholder' + i);
  }
  let page_scale = d3scale.scaleBand(
      page_uids,
      memory_scale.range())
    .paddingInner(0.05);

  return (
    <svg width={props.width} height={props.height}>
      <MemoryBar mem={state.mem} memory_scale={memory_scale} height={limitY / 4} />
      <Pages
        processes={processes}
        pagemngr={state.pagemngr}
        page_scale={page_scale}
        height={limitY / 4}
        memory_scale={memory_scale}
        y={limitY / 4 * 1.1} />
      <Processes
        processes={processes}
        process_scale={process_scale}
        height={limitY / 4}
        memory_scale={memory_scale}
        y={limitY / 4 * 2} />
    </svg>
  )
}