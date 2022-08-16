"use strict";

const WIN_COMBOS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

const EASY = "Easy";
const MEDIUM = "Medium";
const IMPOSSIBLE = "Impossible";

const SINGLE_PLAYER = "Computer";
const MULTI_PLAYER = "2 Players";

const O = "o";
const X = "x";

const DRAW = "draw";

const game = {
    darkTheme: true,
    mode: null,
    difficulty: null,
};

const player1 = {
    name: "Player 1",
    symbol: X,
    score: 0,
};

const player2 = {
    name: "Player 2",
    symbol: O,
    score: 0,
};

let currentPlayer = player1;
const boardState = Array(9);

// selecting elements
const $home = get("#home");
const $difficulty = get("#difficulty");
const $game = get("#game");
const $gameMode = get("#game-mode");
const $board = get("#board");
const $cells = getAll(".cell");
const $p1Name = get("#p1-name");
const $p2Name = get("#p2-name");
const $sunSvg = get("#sun-svg");
const $moonSvg = get("#moon-svg");

$cells.forEach(($cell, i) => ($cell.dataset.index = i));

// adding events
getAll("#symbols .symbol").forEach(($symbol) => {
    $symbol.addEventListener("click", chooseSymbol);
});

get("#home-btn").addEventListener("click", () => {
    $game.className = "inactive";
    $difficulty.className = "inactive";
    $home.className = "active";
});

get("#theme-btn").addEventListener("click", changeTheme);

get("#single-player-btn").addEventListener("click", () => {
    game.mode = SINGLE_PLAYER;

    player1.name = "You";
    player2.name = "Computer";

    $home.className = "inactive";
    $difficulty.className = "active";
});

get("#multi-player-btn").addEventListener("click", () => {
    game.mode = MULTI_PLAYER;

    player1.name = "Player 1";
    player2.name = "Player 2";

    startGame();
});

for (const $btn of getAll("#difficulty .btn")) {
    $btn.addEventListener("click", () => {
        game.difficulty = $btn.dataset.difficulty;
        startGame();
    });
}

get("#restart-btn").addEventListener("click", () => startGame(false));

function get(selector) {
    return document.querySelector(selector);
}

function getAll(selector) {
    return document.querySelectorAll(selector);
}

function chooseSymbol(e) {
    get(".symbol--selected").classList.remove("symbol--selected");
    e.target.classList.add("symbol--selected");

    player1.symbol = e.target.firstElementChild.className;
    player2.symbol = player1.symbol === O ? X : O;
}

function changeTheme() {
    game.darkTheme = !game.darkTheme;
    if (game.darkTheme) {
        $sunSvg.style.display = "none";
        $moonSvg.style.display = "block";
        document.documentElement.classList.remove("light");
    } else {
        $sunSvg.style.display = "block";
        $moonSvg.style.display = "none";
        document.documentElement.classList.add("light");
    }
}

function startGame(reset = true) {
    currentPlayer = player1;
    $board.classList.remove("game-draw");

    if (reset) {
        $home.className = "inactive";
        $difficulty.className = "inactive";
        $game.className = "active";

        $gameMode.innerHTML = game.mode;
        if (game.mode === SINGLE_PLAYER) {
            $gameMode.innerHTML += `&nbsp; - &nbsp;${game.difficulty}`;
        }

        $p1Name.innerText = player1.name;
        $p2Name.innerText = player2.name;

        player1.score = player2.score = 0;

        get("#p1 .score-head span").className = player1.symbol;
        get("#p2 .score-head span").className = player2.symbol;
        updateScoreboard();
    }

    // clear the board
    for (let i = 0; i < 9; ++i) {
        boardState[i] = null;
        $cells[i].classList.remove("win");

        let $symbol = $cells[i].firstElementChild;
        if ($symbol) {
            $symbol.remove();
        }
    }

    highlightCurrentPlayer();
    enableCellClicks();
}

function updateScoreboard() {
    get("#p1 .score").innerText = player1.score;
    get("#p2 .score").innerText = player2.score;
}

function highlightCurrentPlayer() {
    get(".score-info.turn").classList.remove("turn");

    if (currentPlayer === player1) {
        get("#p1").classList.add("turn");
    } else {
        get("#p2").classList.add("turn");
    }
}

function drawSymbol(player) {
    const symbol = document.createElement("span");
    symbol.className = player.symbol;
    return symbol;
}

function enableCellClicks() {
    getEmptycells().forEach((i) => {
        $cells[i].addEventListener("click", makeMove);
    });
}

function disableCellClicks() {
    $cells.forEach(($cell) => {
        $cell.removeEventListener("click", makeMove);
    });
}

function getEmptycells(state = boardState) {
    return state.map((_, i) => i).filter((i) => state[i] === null);
}

function makeMove(e) {
    const $cell = e.target;
    $cell.append(drawSymbol(currentPlayer));
    $cell.removeEventListener("click", makeMove);

    const cellIndex = Number($cell.dataset.index);
    boardState[cellIndex] = currentPlayer.symbol;

    const result = getGameResult(boardState);
    if (result === null) {
        currentPlayer = currentPlayer === player1 ? player2 : player1;
        highlightCurrentPlayer();

        if (game.mode === SINGLE_PLAYER && currentPlayer === player2) {
            computerMove();
        }
    } else {
        gameOver(result);
    }
}

function getGameResult(boardState) {
    if (checkBoard(player1, boardState)) {
        return player1;
    } else if (checkBoard(player2, boardState)) {
        return player2;
    } else {
        return getEmptycells(boardState).length === 0 ? DRAW : null;
    }
}

function checkBoard(player) {
    for (let combo of WIN_COMBOS) {
        if (combo.every((i) => boardState[i] === player.symbol)) {
            return combo;
        }
    }
}

function gameOver(player) {
    disableCellClicks();

    if (player === DRAW) {
        $board.classList.add("game-draw");
    } else {
        player.score++;
        checkBoard(player, boardState).forEach((i) => $cells[i].classList.add("win"));
    }

    updateScoreboard();
}

function computerMove() {
    disableCellClicks();

    const move = chooseComputerMove();
    setTimeout(() => {
        enableCellClicks();
        $cells[move].click();
    }, 500);
}

function chooseComputerMove() {
    const emptyCells = getEmptycells();

    if (game.difficulty === EASY) {
        // check if AI can win
        for (let i of emptyCells) {
            boardState[i] = currentPlayer.symbol;
            if (getGameResult(boardState) === player2) {
                boardState[i] = null;
                return i;
            }

            boardState[i] = null;
        }

        return getRandomMove();
    } else if (game.difficulty === MEDIUM) {
        // check if AI can win
        for (let i of emptyCells) {
            boardState[i] = currentPlayer.symbol;
            if (getGameResult(boardState) == player2) {
                boardState[i] = null;
                return i;
            }

            boardState[i] = null;
        }

        // check if opponent can win
        for (let i of emptyCells) {
            boardState[i] = player1.symbol;
            if (getGameResult(boardState) == player1) {
                boardState[i] = null;
                return i;
            }

            boardState[i] = null;
        }

        return Math.random() < 0.5 ? getRandomMove() : getBestMove();
    } else {
        return getBestMove();
    }
}

function getRandomMove() {
    let emptyCells = getEmptycells();
    const random = Math.floor(Math.random() * emptyCells.length);
    return emptyCells[random];
}

function getBestMove() {
    let bestScore = -Infinity,
        bestMove;

    const emptyCells = getEmptycells();
    for (let index of emptyCells) {
        boardState[index] = player2.symbol;

        let score = minimax(boardState, false, 0, bestScore, Infinity);
        if (score > bestScore) {
            bestScore = score;
            bestMove = index;
        }

        boardState[index] = null;
    }

    return bestMove;
}

function minimax(boardState, isMax, depth, alpha, beta) {
    const result = getGameResult(boardState);
    if (result !== null) {
        if (result === DRAW) return 0;

        return result === player2 ? 100 - depth : -100 + depth;
    }

    const emptyCells = getEmptycells(boardState);

    if (isMax) {
        let bestScore = -Infinity;
        for (let i of emptyCells) {
            boardState[i] = player2.symbol;
            bestScore = Math.max(bestScore, minimax(boardState, false, depth + 1, alpha, beta));
            boardState[i] = null;

            /*
             * alpha is the score that the Max (current node) is considering.
             * beta is the score that the Min (parent node) is considering.
             * Now if Max finds a score that is greater than or equal to beta
             * (alpha >= beta), Min will stop exploring Max because whatever
             * move that Max would otherwise choose will be greater than or
             * equal to alpha.
             */
            alpha = Math.max(alpha, bestScore);
            if (alpha >= beta) break;
        }

        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i of emptyCells) {
            boardState[i] = player1.symbol;
            bestScore = Math.min(bestScore, minimax(boardState, true, depth + 1, alpha, beta));
            boardState[i] = null;

            /*
             * alpha is the score that the Max (parent node) is considering.
             * beta is the score that the Min (current node) is considering.
             * Now if Min finds a score that is less than or equal to alpha
             * (beta <= alpha), Max will stop exploring Min because whatever
             * move that Min would otherwise choose will be less than or
             * equal to beta.
             */
            beta = Math.min(beta, bestScore);
            if (beta <= alpha) break;
        }

        return bestScore;
    }
}
