const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const games = {}; // Store game state by room

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinGame', (room) => {
        if (!games[room]) {
            games[room] = { players: [], board: Array(9).fill(''), turn: 'X' };
        }

        const game = games[room];
        if (game.players.length >= 2) {
            socket.emit('spectator');
            return;
        }

        const symbol = game.players.length === 0 ? 'X' : 'O';
        game.players.push({ id: socket.id, symbol });
        socket.join(room);
        socket.emit('assignSymbol', symbol);

        io.to(room).emit('updatePlayers', game.players.map(p => p.symbol));
        console.log(`Player ${symbol} joined room ${room}`);
    });

    socket.on('makeMove', ({ room, index, player }) => {
        const game = games[room];
        if (!game || game.turn !== player || game.board[index] !== '') return;

        game.board[index] = player;
        game.turn = player === 'X' ? 'O' : 'X';
        io.to(room).emit('moveMade', { index, player });

        const winner = checkWinner(game.board);
        if (winner) {
            io.to(room).emit('gameOver', { winner });
        } else if (game.board.every(cell => cell !== '')) {
            io.to(room).emit('gameOver', { winner: 'Draw' });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const room in games) {
            const game = games[room];
            game.players = game.players.filter(p => p.id !== socket.id);
            if (game.players.length === 0) delete games[room];
        }
    });
});

function checkWinner(board) {
    const wins = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]            // Diagonals
    ];
    for (const [a, b, c] of wins) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

//server.listen(3000, () => {
//    console.log('Server running on http://localhost:3000');
//});
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});