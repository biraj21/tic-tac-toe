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

const O = "o";
const X = "x";

const DRAW = "draw";

const game = {
    dark_theme: true,
    mode: null,
    difficulty: null,
    sound: true,
    tap_sound: null,

    play_sound() {
        if (game.sound) {
            game.tap_sound.pause();
            game.tap_sound.currentTime = 0;
            game.tap_sound.play();
        }
    }
};

const player1 = {
        name: "Player 1",
        symbol: O,
        score: 0,
    },
    player2 = {
        name: "Player 2",
        symbol: X,
        score: 0,
    };

let current_player = player1;
const board_state = Array(9);

// elements
let home_el, difficulty_el, game_el, cells_el, p1_name_el, p2_name_el;

window.onload = e => {
    home_el = $("#home");
    difficulty_el = $("#difficulty");
    game_el = $("#game");
    cells_el = Array.from(document.querySelectorAll(".cell"));
    p1_name_el = $("#p1-name");
    p2_name_el = $("#p2-name");

    // adding events
    game.tap_sound = new Audio("/audio/tapsound.mp3");

    document.querySelectorAll("button")
        .forEach(btn => {
            btn.addEventListener("click", () => game.play_sound());
        });

    document.querySelectorAll("#symbols .symbol")
        .forEach(symbol => symbol.onclick = choose_symbol);

    $("#home-btn").onclick = () => {
        game_el.className = "inactive";
        difficulty_el.className = "inactive";
        home_el.className = "active";
    };

    let settings = $("#settings");
    $("#settings-btn").onclick = () => settings.classList.add("active");
    $("#save-settings-btn").onclick = () => settings.classList.remove("active");

    document.querySelectorAll(".toggle-btn")
        .forEach(btn => btn.addEventListener(
            "click",
            () => btn.classList.toggle("toggle-btn--on")
        ));

    $("#theme-btn").onclick = change_theme;
    $("#sound-btn").onclick = () => game.sound = !game.sound;

    $("#single-player-btn").onclick = () => {
        game.mode = "single-player";

        player1.name = "You";
        player2.name = "Computer";

        home_el.className = "inactive";
        difficulty_el.className = "active";

        game.active_page = difficulty_el;
    };

    $("#multi-player-btn").onclick = () => {
        game.mode = "multi-player";

        player1.name = "Player 1";
        player2.name = "Player 2";

        start_game();
    };

    $("#easy-btn").onclick = () => {
        game.difficulty = "easy";
        start_game();
    };

    $("#medium-btn").onclick = () => {
        game.difficulty = "medium";
        start_game();
    };

    $("#impossible-btn").onclick = () => {
        game.difficulty = "impossible";
        start_game();
    };

    $("#restart-btn").onclick = () => start_game(false);
};

function $(selector) {
    return document.querySelector(selector);
}

function choose_symbol(e) {
    $(".selected").classList.remove("selected");
    e.target.classList.add("selected");

    player1.symbol = $(".selected span").className;
    player2.symbol = player1.symbol === O ? X : O;
}

function change_theme() {
    game.dark_theme = !game.dark_theme;
    let root = document.documentElement;

    if (game.dark_theme)
        root.classList.remove("light");
    else
        root.classList.add("light");
}

function start_game(new_game = true) {
    current_player = player1;
    game.active_page = game_el;

    // reset scores if it's a new game
    if (new_game) {
        home_el.className = "inactive";
        difficulty_el.className = "inactive";
        game_el.className = "active";

        p1_name_el.innerText = player1.name;
        p2_name_el.innerText = player2.name;

        player1.score = player2.score = 0;

        $("#p1 .score-head span").className = player1.symbol;
        $("#p2 .score-head span").className = player2.symbol;
        update_scoreboard();
    }

    // clear the board
    for (let i = 0; i < 9; ++i) {
        board_state[i] = null;
        cells_el[i].classList.remove("win");

        let symbol_el = cells_el[i].firstElementChild;
        if (symbol_el)
            cells_el[i].removeChild(symbol_el);
    }

    highlight_current_player();
    enable_cell_clicks();
}

function update_scoreboard() {
    $("#p1 .score").innerText = player1.score;
    $("#p2 .score").innerText = player2.score;
}

function highlight_current_player() {
    $(".score-info.turn").classList.remove("turn");

    if (current_player === player1)
        $("#p1").classList.add("turn");
    else
        $("#p2").classList.add("turn");
}

function draw_symbol(player) {
    const symbol = document.createElement("span");
    symbol.className = player.symbol;
    return symbol;
}

function enable_cell_clicks() {
    get_empty_cells().forEach(i => cells_el[i].onclick = e => player_move(e));
}

function get_empty_cells(given_state = board_state) {
    return given_state.map((_, i) => i)
        .filter(i => given_state[i] === null);
}

function player_move(e) {
    game.play_sound();

    let cell = e.target;
    cell.appendChild(draw_symbol(current_player));
    cell.onclick = null;
    board_state[cells_el.indexOf(cell)] = current_player.symbol;

    let result = game_result(board_state);
    if (result === null) {
        current_player = current_player === player1 ? player2 : player1;
        highlight_current_player();

        if (game.mode === "single-player" && current_player === player2)
            computer_move();
    } else {
        game_over(result);
    }
}

function game_result(board_state) {
    if (check_board(player1, board_state))
        return player1;
    else if (check_board(player2, board_state))
        return player2;
    else
        return get_empty_cells(board_state).length === 0 ? DRAW : null;
}

function check_board(player) {
    for (let combo of WIN_COMBOS) {
        if (combo.every(i => board_state[i] === player.symbol))
            return combo;
    }
}

function game_over(player) {
    disable_cell_clicks();

    if (player !== DRAW) {
        player.score++;
        check_board(player, board_state).forEach(i => cells_el[i].classList.add("win"));
    }

    update_scoreboard();
}

function disable_cell_clicks() {
    cells_el.forEach(cell => cell.onclick = null);
}

function computer_move() {
    disable_cell_clicks();

    let next_move;
    if (game.difficulty === "easy")
        next_move = random_move();
    else if (game.difficulty === "medium")
        next_move = (Math.random() < 0.5) ? random_move() : best_move();
    else
        next_move = best_move();

    setTimeout(() => {
        enable_cell_clicks();
        cells_el[next_move].click();
    }, 500);
}

function random_move() {
    let empty_cells = get_empty_cells();
    const random = Math.floor(Math.random() * empty_cells.length);
    return empty_cells[random];
}

function best_move() {
    let best_score = -Infinity,
        best_move;

    let empty_cells = get_empty_cells();
    for (let index of empty_cells) {
        board_state[index] = player2.symbol;

        let score = minimax(board_state, false, 0);
        if (score > best_score) {
            best_score = score;
            best_move = index;
        }

        board_state[index] = null;
    }

    return best_move;
}

function minimax(board_state, is_max, depth) {
    const result = game_result(board_state);
    if (result !== null) {
        if (result === DRAW)
            return 0;

        return result === player2 ? 100 - depth : -100 + depth;
    }

    const empty_cells = get_empty_cells(board_state);

    if (is_max) {
        let best_score = -Infinity;
        for (let i of empty_cells) {
            board_state[i] = player2.symbol;
            best_score = Math.max(best_score, minimax(board_state, false, depth + 1));
            board_state[i] = null;
        }

        return best_score;
    } else {
        let best_score = Infinity;
        for (let i of empty_cells) {
            board_state[i] = player1.symbol;
            best_score = Math.min(best_score, minimax(board_state, true, depth + 1));
            board_state[i] = null;
        }

        return best_score;
    }
}