import React from 'react';
import * as d3scale from 'd3-scale';
import * as d3color from 'd3-color';
import { color_from_pid } from './utilities';
import './Gantt.css';

// If ms is under 3 digits, render as ms. Otherwise render as s.
function render_ms(ms) {
  if (ms < 1000) {
    return `${ms}ms`
  }
  const s = Math.floor(ms / 100) / 10;
  return `${s}s`
}

// Given a list of steps, transform into a format more friendly for Gantt charts
// Processes which run in step n-1 that also run in step n are 
function steps_to_blocks(steps) {
  if (steps.length === 0) return [];

  let current_pid = steps[0].pid;
  let start = steps[0].clock - steps[0].time;
  let end = steps[0].clock;
  let blocks = [];

  for (let i = 1; i < steps.length; i++) {
    const step = steps[i];
    if (current_pid === step.pid) {
      // Extend the end time.
      end = step.clock;
    } else {
      // Break it off and make a new block
      blocks.push({start, end, pid: current_pid});
      current_pid = step.pid;
      start = step.clock - step.time;
      end = step.clock;
    }
  }
  // Break off the rest
  blocks.push({start, end, pid: current_pid});
  return blocks;
}

function GanttBlock(props) {
  const w = props.scale(props.block.end) - props.scale(props.block.start);
  const x = props.scale(props.block.start);
  const fill = props.block.pid === null ? '#FFF' : color_from_pid(props.block.pid);
  let stroke = d3color.hsl(fill);
  stroke.l = Math.max(0, stroke.l - 0.2);
  const text = props.block.pid === null ? '' : props.block.pid;

  return (
    <g transform={`translate(${x},0)`}>
      <rect width={w} height={props.height} fill={fill + ''} stroke={stroke + ''} />
      <text className='gantt_caption' x={2} y={12}>{text}</text>
      <text className='gantt_start' x={1} y={props.height - 2}>{render_ms(props.block.start)}</text>
      <text className='gantt_end' x={w - 2} y={props.height - 2}>{render_ms(props.block.end)}</text>
    </g>
  )
}

export default function Gantt(props) {
  const cputimes = steps_to_blocks(props.steps.filter(d => d.time !== 0));
  let domain;
  if (cputimes.length === 0) {
    domain = [0, 0];
  } else {
    domain = [cputimes[0].start, cputimes[cputimes.length - 1].end];
  }
  domain[1] = Math.max(1000, domain[1]);
  let scaleX = d3scale.scaleLinear(domain, [0, props.width]);
  const blocks = cputimes.map((d, i) => (<GanttBlock key={i} height={props.height / 2} scale={scaleX} block={d} />))
  return (
    <svg width={props.width} height={props.height}>
      <g className='gantt_blocks' transform={`translate(0, ${props.height / 4})`}>
        {blocks}
      </g>
    </svg>
  )
}