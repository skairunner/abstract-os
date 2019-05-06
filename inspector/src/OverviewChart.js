import React from 'react';
import * as d3scale from 'd3-scale';
import * as d3color from 'd3-color';
import proportionalScale from './ProportionalScale';
import { generate_mempattern, color_from_pid } from './utilities';
import './OverviewChart.css';

function Frame(props) {
  const x = props.memory_scale(props.addr) + 1;
  const w = props.memory_scale(props.addr + 1) - x;
  const tilesize = Math.max(2, Math.floor(w / 5));
  const pattern = generate_mempattern(w, props.height, props.data, tilesize);
  props.mem_renders[props.data] = pattern;
  const dark_rect = <rect className='dark_mem' width={w} height={props.height} opacity={props.darken ? 1 : 0} />
  return (
    <g className='memframe' transform={`translate(${x}, 0)`}>
      <image y={1} width={w} height={props.height - 2} xlinkHref={pattern.imgurl} />
      {dark_rect}
      <text x={w / 2} y={props.height - 2} fill='black' textAnchor='middle'>{props.addr}</text>
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
      mem_renders={props.mem_renders}
      memory_scale={props.memory_scale}
      darken={!props.mem_is_reffed.has(i)}/>
  ));
  const w = props.memory_scale.range()[1];
  return (
    <g className='memory_bar'>
      <text
        className='label'
        transform={`translate(-2, ${props.height / 2}) rotate(-90)`}>MEMORY</text>
      <rect width={w} height={props.height} />
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
      <rect fill={color_from_pid(props.process.pid)} width={width} height={props.height} />
      <text x={3} y={18}>{props.process.name}</text>
      <text x={3} y={36}>pid: {props.process.pid}</text>
    </g>
  )
}

function Pages(props) {
  const pages = props.pages.map((d, i) => (
    <Page key={i} page={d} scale={props.page_scale} height={props.height} />
  ))
  return (
    <g className='Pages' transform={`translate(0, ${props.y})`}>
      <text className='label' transform={`translate(-2, ${props.height / 2}) rotate(-90)`}>PAGES</text>
      {pages}
    </g>
  )
}

function Processes(props) {
  const procs = props.processes.map(d => (
    <Process key={d.pid} height={props.height} process={d} scale={props.process_scale} />
  ))

  return (
    <g className='Processes' transform={`translate(0, ${props.y})`}>
      <text className='label' transform={`translate(-2, ${props.height / 2}) rotate(-90)`}>PROCESSES</text>
      {procs}
    </g>
  )
}

// Draws vertical-flat-vertical shaped lines, where the flats are in a small area
// and don't overlap.
function MemToPageLines(props) {
  const pages = props.pages;
  const bundle_top = props.height * props.bundle_proportion / 2;
  const bundle_bot = props.height * (1 - props.bundle_proportion / 2)
  let scale = d3scale.scaleLinear([0, pages.length], [bundle_top, bundle_bot]);
  let lines = pages.map((d, i) => {
    if (d.addr === null) {
      return null;
    }
    let x0 = props.memory_scale(d.addr + .5);
    let y = scale(i + 0.5); // The height in the bundle of this line
    let x1 = props.page_scale(d.uid) + props.page_scale.bandwidth() / 2;
    let col = d3color.hsl(props.mem_renders[props.mem.memory[d.addr]].color);
    col.l = Math.max(0, col.l - 0.2);
    return (
      <path
        stroke={col.toString()}
        key={d.uid}
        d={`M${x0},0 L${x0},${y} L${x1},${y} L${x1},${props.height}`} />);
  })
  return (
    <g className='MemPageLines' transform={`translate(0,${props.y})`}>
      {lines}
    </g>
  );
}

function PageToProcLines(props) {
  // First build a dictionary of processes.
  // Build a page uid -> pid map
  let pidFromUid = new Map();
  for (let process of props.processes) {
    for (let uid of process.pages) {
      if (!pidFromUid.has(process)) {
        pidFromUid.set(uid, process.pid);
      }
    }
  }
  // For each page, draw a line from the center of the page to the center of the process.
  let lines = props.pages.map((d, i) => {
    if (!pidFromUid.has(d.uid)) return null;
    const pid = pidFromUid.get(d.uid);
    let args = {
      x1: props.page_scale(d.uid) + props.page_scale.bandwidth() / 2,
      y1: props.vscale('page-proc'),
      x2: props.process_scale(pid) + props.process_scale.bandwidth(pid) / 2,
      y2: props.vscale('proc')
    };
    return(<line key={i} {...args}/>)
  });
  return (
    <g className='PageProcLines'>
      {lines}
    </g>
  )
}

export default function OverviewChart(props) {
  // Destructuring to set defaults for missing values
  const {
    padding_h = 0,
    padding_w = 0,
    padding_left = 0
  } = props;

  const state = props.state;
  if (!state) {
    return null;
  }
  const processes = state.scheduler.processes;

  const limitX = props.width - 2 * padding_w - padding_left;
  const memory_scale = d3scale.scaleLinear([0, state.mem.framecount], [0, limitX - 1]);

  // First define process's band. Divide horizontal space into minimum 5 areas.
  let processdomain = processes.map(d => [d.pid, d.pages.length]);
  const processcount = processes.reduce((a, d) => a + d.pages.length, 0)
  if (processcount < 5) {
    processdomain.push([`placeholder`, 5 - processcount]);
  }
  const process_scale = proportionalScale(processdomain, memory_scale.range())
    .paddingInner(0.05)
    .paddingOuter(1);

  // Next, determine the scale of the pages.
  // Pages are located near the first process that 'owns' it. Essentially,
  // sort the pages by the first process that claims it.
  let page_uids = [];
  let did_put_page = new Set();
  for (let process of processes) {
    for (let pageid of process.pages) {
      if (!did_put_page.has(pageid)) {
        did_put_page.add(pageid);
        // If the page is freed, don't add it
        if (!state.pagemngr.pages[pageid].freed) {
          page_uids.push(pageid);
        }
      }
    }
  }
  const pages = state.pagemngr.pages.filter(d => !d.freed);
  // Insert all pages that don't have owners
  let is_referenced = new Set(); // In order to darken un-referenced memory
  pages.forEach(d => {
    if (!did_put_page.has(d.uid)) {
      is_referenced.add(d.addr);
    }
  });

  // Add extra pages if needed, to have a minimum block width
  for (let i = 0; i <= 5 - page_uids.length; i++) {
    page_uids.push('placeholder' + i);
  }
  console.log(pages, page_uids)
  let page_scale = d3scale.scaleBand(
      page_uids,
      memory_scale.range())
    .paddingInner(0.05);

  // Define a vertical scale to place the bar, bar-page lines, pages, page-process lines, and processes.
  let vscale = proportionalScale([
    ['mem', 2],
    ['mem-page', 2],
    ['page', 1],
    ['page-proc', 1],
    ['proc', 2]
  ], [0, props.height]);

  return (
    <svg width={props.width} height={props.height}>
    <g transform={`translate(${padding_left + padding_w}, 0)`}>
      <MemoryBar
          mem={state.mem}
          memory_scale={memory_scale}
          height={vscale.bandwidth('mem')}
          mem_renders={props.mem_renders}
          mem_is_reffed={is_referenced} />
        <MemToPageLines
          pages={pages}
          page_scale={page_scale}
          memory_scale={memory_scale}
          mem={state.mem}
          mem_renders={props.mem_renders}
          height={vscale.bandwidth('mem-page')}
          bundle_proportion = {0.4}
          y={vscale('mem-page')}
        />
        <Pages
          processes={processes}
          pages={pages}
          page_scale={page_scale}
          memory_scale={memory_scale}
          height={vscale.bandwidth('page')}
          y={vscale('page')} />
        <PageToProcLines
          processes={processes}
          pages={pages}
          page_scale={page_scale}
          process_scale={process_scale}
          vscale={vscale} />
        <Processes
          processes={processes}
          process_scale={process_scale}
          memory_scale={memory_scale}
          height={vscale.bandwidth('proc')}
          y={vscale('proc')} />
    </g>
    </svg>
  )
}