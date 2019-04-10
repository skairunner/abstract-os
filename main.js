document.addEventListener('DOMContentLoaded', init);

function init() {
  let socket = new WebSocket('ws://localhost:8765');
  socket.onopen = e => {
    console.log('Connection opened');
  };
  socket.onmessage = e => {
    console.log(e.data);
  }
  document.getElementById('send').onclick = () => socket.send('');
}