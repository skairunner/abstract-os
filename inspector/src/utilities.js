export default function get_rel_coords(event) {
  let rect = event.currentTarget.getBoundingClientRect();
  return {x: event.pageX - rect.left, y: event.pageY - rect.top}
}