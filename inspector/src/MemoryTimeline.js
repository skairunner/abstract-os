import React, { Component } from 'react';
import * as d3scale from 'd3-scale';
import * as d3zoom from 'd3-zoom';
import * as d3 from 'd3-selection';
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

export default class MemoryTimeline extends Component {
  constructor(props) {
    super(props);
    this.svgref = React.createRef();
    this.state = {
      y: 0,
      z: 1
    }
  }

  componentDidMount() {
    // We use d3-zoom because zoom behaviours are very hard to get right
    // Also couldn't find a comparable-quality react-based zoom library.
    const zoom = d3zoom.zoom()
      .on('zoom', this.zoomed);
    d3.select(this.svgref.current)
      .call(zoom);
  }

  zoomed = () => {
    let {k, y} = d3.event.transform;
    this.setState(oldstate => ({
      ...oldstate,
      y,
      z: k
    }));
  }

  render() {
    const props = this.props;
    if (props.mem_renders.length === 0) {
      return null;
    }
    let scaleY = d3scale.scaleLinear([0, props.clock], [0, props.clock / 4]);
    const blocks = props.mem_history.map((d, i) => (<MemoryTimelineBlock
      key={i}
      data={d}
      render={props.mem_renders[d.data]}
      scaleY={scaleY} />));
    const view_w = (THUMB_WIDTH + 2) * props.framecount + 5;
    const initial_y = props.height - this.props.clock / 4;
    return (
      <svg className='MemoryTimeline' width={props.width} height={props.height}>
        <svg width={props.width} height={props.height} viewBox={`0 0 ${view_w} ${this.props.height}`}>
          <g transform={`translate(1, ${this.state.y + initial_y}) scale(${this.state.z})`}>
            {blocks}
          </g>
        </svg>
        <rect width='100%' height={props.height} opacity={0} ref={this.svgref}/>
      </svg>
    )
  }
}