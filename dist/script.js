const socket = io();
const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const status = document.getElementById('status');
const gameDiv = document.getElementById('game');
const roomInputDiv = document.getElementById('room-input');
let mySymbol;
let currentRoom;

function joinRoom() {
    const room = document.getElementById('room').value.trim();
    if (room) {
        currentRoom = room;
        socket.emit('joinGame', room);
        roomInputDiv.style.display = 'none';
        gameDiv.style.display = 'block';
    }
}

socket.on('assignSymbol', (symbol) => {
    mySymbol = symbol;
    status.textContent = `You are Player ${symbol}`;
});

socket.on('spectator', () => {
    status.textContent = 'Room full. You are a spectator.';
    cells.forEach(cell => cell.style.cursor = 'not-allowed');
});

socket.on('updatePlayers', (players) => {
    status.textContent = `Players: ${players.join(' vs ')}. Current turn: ${mySymbol === 'X' ? 'X' : 'O'}`;
});

cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const index = cell.getAttribute('data-index');
        if (cell.textContent === '' && mySymbol) {
            socket.emit('makeMove', { room: currentRoom, index, player: mySymbol });
        }
    });
});

socket.on('moveMade', ({ index, player }) => {
    cells[index].textContent = player;
    status.textContent = `Current turn: ${player === 'X' ? 'O' : 'X'}`;
});

socket.on('gameOver', ({ winner }) => {
    status.textContent = winner === 'Draw' ? 'Game is a Draw!' : `Player ${winner} wins!`;
    cells.forEach(cell => cell.style.cursor = 'not-allowed');
});