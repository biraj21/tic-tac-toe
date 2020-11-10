"use strict";

const app = {
    active_page: null,
    themes: {
        dark: {
            bg: "#000000",
            text: "#ffffff",
        },
        light: {
            bg: "#ffffff",
            text: "#000000",
        },
    },
    dark_theme: true,
    mode: null,
    level: null,
    sound: true,
    tap_sound: null,

    play_sound() {
        if (app.sound) {
            app.tap_sound.pause();
            app.tap_sound.currentTime = 0;
            app.tap_sound.play();
        }
    }
};

const win_combos = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

const player1 = {
    name: "Player 1",
    symbol: "o",
    score: 0,
},
player2 = {
    name: "Player 2",
    symbol: "x",
    score: 0,
};

let current_player = player1;

// elements
let home, levels, game, squares, name1, name2;

window.onload = _e => {
    home = $("#home");
    levels = $("#levels");
    game = $("#game");
    squares = Array.from(document.querySelectorAll(".square"));
    name1 = $("#p1-name");
    name2 = $("#p2-name");

    // adding events
    app.tap_sound = new Audio(
        "../audio/tapsound.mp3"
    );

    document.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", _e => app.play_sound());
    });

    document
    .querySelectorAll("#symbols .symbol")
    .forEach(symbol => symbol.onclick = choose_symbol);

    $("#back-btn").onclick = _e => {
        if (app.active_page === game) {
            game.className = "flex inactive";
            if (app.mode === "single-player") {
                levels.className = "active";
                app.active_page = levels;
            } else {
                home.className = "active";
                app.active_page = home;
            }
        } else if (app.active_page === levels) {
            levels.className = "inactive";
            home.className = "active";
            app.active_page = home;
        }
    }

    $("#settings-btn").onclick = _e => $("#settings").classList.add("active");
    $("#save-settings-btn").onclick = _e => $("#settings").classList.remove("active");

    document.querySelectorAll(".toggle-btn").forEach((btn) => {
        btn.addEventListener(
            "click",
            _e => (btn.value = btn.value === "on" ? "off": "on")
        );
    });

    $("#theme-btn").addEventListener("click", _e => {
        app.dark_theme = !app.dark_theme;
        change_theme();
    });

    $("#sound-btn").addEventListener("click", _e => (app.sound = !app.sound));

    $("#single-player-btn").onclick = _e => {
        app.mode = "single-player";

        player1.name = "You";
        player2.name = "Computer";

        home.className = "inactive";
        levels.className = "active";

        app.active_page = levels;
    };
    $("#multi-player-btn").onclick = e => {
        app.mode = "multi-player";

        player1.name = "Player 1";
        player2.name = "Player 2";

        start_game(e, true);
    };
    $("#exit-btn").onclick = _e => window.close();

    $("#easy-btn").onclick = e => {
        app.level = "easy";
        start_game(e, true);
    };
    $("#medium-btn").onclick = e => {
        app.level = "medium";
        start_game(e, true);
    };
    $("#impossible-btn").onclick = e => {
        app.level = "impossible";
        start_game(e, true);
    };

    $("#restart-btn").onclick = e => start_game(e, false);
};

function $(selector) {
    return document.querySelector(selector);
}

function choose_symbol(e) {
    $(".selected").classList.remove("selected");
    e.target.classList.add("selected");

    player1.symbol = $(".selected").firstElementChild.className;
    player2.symbol = player2.symbol = player1.symbol === "o" ? "x": "o";
}

function change_theme() {
    let root = document.documentElement;

    if (app.dark_theme) {
        root.style.setProperty("--bg-main", app.themes.dark.bg);
        root.style.setProperty("--text-main", app.themes.dark.text);
    } else {
        root.style.setProperty("--bg-main", app.themes.light.bg);
        root.style.setProperty("--text-main", app.themes.light.text);
    }
}

function start_game(_e, new_game = true) {
    current_player = player1;

    app.active_page = game;

    if (new_game) {
        home.className = "inactive";
        levels.className = "inactive";

        game.classList.add("active");

        name1.innerText = player1.name;
        name2.innerText = player2.name;

        player1.score = player2.score = 0;
    }

    for (let square of squares) {
        square.classList.remove("win");

        let symbol_el = square.firstElementChild;

        if (symbol_el)
            square.removeChild(symbol_el);
    }

    update_scoreboard();
    show_move();
    add_click();
}

function update_scoreboard() {
    const p1_score_head = $("#p1 .score-head");

    if (p1_score_head.firstElementChild !== null)
        p1_score_head.removeChild(p1_score_head.firstElementChild);

    p1_score_head.appendChild(symbol_element(player1));
    $("#p1 .score").innerText = player1.score;

    const p2_score_head = $("#p2 .score-head");

    if (p2_score_head.firstElementChild !== null)
        p2_score_head.removeChild(p2_score_head.firstElementChild);

    p2_score_head.appendChild(symbol_element(player2));
    $("#p2 .score").innerText = player2.score;
}

function show_move() {
    $(".move").classList.remove("move");

    if (current_player === player1)
        $("#p1").classList.add("move");
    else
        $("#p2").classList.add("move");

    // after showing move
    if (app.mode === "single-player" && current_player === player2)
        computer_move();
}

function symbol_element(player) {
    const symbol = document.createElement("span");
    symbol.className = player.symbol;
    return symbol;
}

function add_click() {
    empty_squares().forEach((i) => (squares[i].onclick = move));
}

function empty_squares(board = board_state()) {
    return board.map((_, i) => i).filter((i) => board[i] === null);
}

function board_state() {
    return squares.map((square) => {
        let first_child = square.firstElementChild;

        return first_child === null ? null: first_child.className;
    });
}

function move() {
    app.play_sound();

    this.appendChild(symbol_element(current_player));

    this.onclick = null;

    let result = game_result(board_state());

    if (result === null) {
        current_player = current_player === player1 ? player2: player1;
        show_move();
    } else {
        game_over(result);
    }
}

function game_result(board) {
    if (check_board(player1, board)) return player1;
    else if (check_board(player2, board)) return player2;
    else return empty_squares(board).length === 0 ? "tie": null;
}

function check_board(player, board = board_state()) {
    for (let combo of win_combos) {
        if (combo.every((i) => board[i] === player.symbol))
            return combo;
    }
}

function game_over(player) {
    remove_click();

    if (player !== "tie") {
        player.score++;
        check_board(player, board_state()).forEach(i => squares[i].classList.add("win"));
    }

    update_scoreboard();
}

function remove_click() {
    squares.forEach(square => square.onclick = null);
}

function computer_move() {
    remove_click();

    let next_move;
    if (app.level === "easy") {
        next_move = random_move();
    } else if (app.level === "medium") {
        let random_number = Math.random();

        if (random_number < 0.5)
            next_move = random_move();
        else
            next_move = best_move(board_state(), empty_squares());

    } else {
        next_move = best_move(board_state(), empty_squares());
    }

    setTimeout(_ => {
        add_click();
        squares[next_move].click();
    }, 500);
}

function random_move() {
    let empty_squares_list = empty_squares();
    const random = Math.floor(Math.random() * empty_squares_list.length);

    return empty_squares_list[random];
}

function best_move(board, empty_squares) {
    let best_score = -Infinity,
    best_move;

    for (let index of empty_squares) {
        board[index] = player2.symbol;
        let score = minimax(board, 0, false);

        if (score > best_score) {
            best_score = score;
            best_move = index;
        }

        board[index] = null;
    }

    return best_move;
}

function minimax(board, depth, is_max) {
    const result = game_result(board);

    if (result !== null) {
        if (result === "tie") return 0;
        return result === player2 ? 100 - depth: -100 + depth;
    }

    const empty_squares_i = empty_squares(board);

    if (is_max) {
        // maximizer
        let best_score = -Infinity;
        for (let i of empty_squares_i) {
            board[i] = player2.symbol;
            best_score = Math.max(best_score, minimax(board, depth + 1, false));
            board[i] = null;
        }
        return best_score;
    } else {
        // minimizer
        let best_score = Infinity;
        for (let i of empty_squares_i) {
            board[i] = player1.symbol;
            best_score = Math.min(best_score, minimax(board, depth + 1, true));
            board[i] = null;
        }
        return best_score;
    }
}