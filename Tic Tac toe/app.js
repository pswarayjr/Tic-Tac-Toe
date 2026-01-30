const boardEl = document.querySelector("#board");
const statusEl = document.querySelector("#status");
const resetBtn = document.querySelector("#resetBtn");
const aiIndicator = document.querySelector("#aiIndicator");
const startSelect = document.querySelector("#startSelect");
const symbolSelect = document.querySelector("#symbolSelect");
const humanScoreEl = document.querySelector("#humanScore");
const computerScoreEl = document.querySelector("#computerScore");
const tieScoreEl = document.querySelector("#tieScore");
const humanLabelEl = document.querySelector("#humanLabel");
const computerLabelEl = document.querySelector("#computerLabel");

let humanScore = 0;
let computerScore = 0;
let tieScore = 0;

let HUMAN = "X";
let COMPUTER = "O";
const modeSelect = document.querySelector("#modeSelect");
modeSelect.addEventListener("change", () => {
    aiMode = modeSelect.value;
    aiIndicator.textContent = `Model: ${aiMode === "minimax" ? "Minimax" : "Heuristic"}`;
    init();
});
startSelect.addEventListener("change", () => {
    init();
});
symbolSelect.addEventListener("change", () => {
    init();
});
let aiMode = "heuristic";

let board;        // array of 9: null | "X" | "O"
let current;      // "X" or "O"
let gameOver;     // boolean

const WIN_LINES = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diagonals
];

function init() {
    board = Array(9).fill(null);
    gameOver = false;

    HUMAN = symbolSelect.value;
    COMPUTER = HUMAN === "X" ? "O" : "X";

    humanLabelEl.textContent = `PLAYER (${HUMAN})`;
    computerLabelEl.textContent = `COMPUTER (${COMPUTER})`;

    // "X" always goes first in this logic, but let's decide based on startSelect
    if (startSelect.value === "human") {
        current = HUMAN;
    } else {
        current = COMPUTER;
    }

    // build 9 clickable cells at once
    boardEl.innerHTML = "";
    for (let i = 0; i < 9; i++) {
        const btn = document.createElement("button");
        btn.className = "cell";
        btn.type = "button";
        btn.dataset.index = String(i);
        btn.setAttribute("role", "grid-cell");
        btn.setAttribute("aria-label", `Cell ${i + 1}`);
        btn.addEventListener("click", onCellClick);
        boardEl.appendChild(btn);
    }

    updateStatus();
    render();

    // If AI starts (it is X), trigger its move
    if (current === COMPUTER) {
        setTimeout(makeAiMove, 200);
    }
}

function bestMoveHeuristic(b, player) {
    const opponent = player === "X" ? "O" : "X";

    // To make it "Simple", let's give it a 40% chance to just move randomly
    if (Math.random() < 0.4) {
        const available = b.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
        return available[Math.floor(Math.random() * available.length)];
    }

    // 1) Win
    let move = findWinningMove(b, player);
    if (move != null) return move;

    // 2) Block
    move = findWinningMove(b, opponent);
    if (move != null) return move;

    // 3) Center
    if (b[4] == null) return 4;

    // 4) Corners
    const corners = [0, 2, 6, 8].filter(i => b[i] == null);
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

    // 5) Sides
    const sides = [1, 3, 5, 7].filter(i => b[i] == null);
    if (sides.length) return sides[Math.floor(Math.random() * sides.length)];

    return null;
}

function findWinningMove(b, player) {
    for (const line of WIN_LINES) {
        const [a, c, d] = line;
        const cells = [b[a], b[c], b[d]];

        // If a player has 2 in the line and one empty, play the empty
        const countPlayer = cells.filter(x => x === player).length;
        const countEmpty = cells.filter(x => x == null).length;
        if (countPlayer === 2 && countEmpty === 1) {
            if (b[a] == null) return a;
            if (b[c] == null) return c;
            return d;
        }
    }
    return null;
}

function bestMoveMinimax(b, player) {
    let bestScore = -Infinity;
    let bestIdx = null;

    for (let i = 0; i < 9; i++) {
        if (b[i] != null) continue;

        b[i] = player;
        const score = minimax(b, 0, false, player);
        b[i] = null;

        if (score > bestScore) {
            bestScore = score;
            bestIdx = i;
        }
    }

    return bestIdx;
}

// player = AI symbol ("O" in our setup)
function minimax(b, depth, isMaximizing, player) {
    const opponent = player === "X" ? "O" : "X";
    const res = getResult(b);

    if (res.type === "win") {
        // If AI wins -> positive. If AI loses -> negative.
        return res.winner === player ? (10 - depth) : (depth - 10);
    }
    if (res.type === "draw") return 0;

    if (isMaximizing) {
        // AI turn: maximize score
        let best = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (b[i] != null) continue;
            b[i] = player;
            best = Math.max(best, minimax(b, depth + 1, false, player));
            b[i] = null;
        }
        return best;
    } else {
        // Human turn: minimize score
        let best = Infinity;
        for (let i = 0; i < 9; i++) {
            if (b[i] != null) continue;
            b[i] = opponent;
            best = Math.min(best, minimax(b, depth + 1, true, player));
            b[i] = null;
        }
        return best;
    }
}


function makeAiMove() {
    if (gameOver) return;

    let idx;
    if (aiMode === "minimax") idx = bestMoveMinimax(board, COMPUTER);
    else idx = bestMoveHeuristic(board, COMPUTER);

    if (idx == null) return;

    board[idx] = COMPUTER;
    checkGameStatus();
}

function onCellClick(e) {
    if (current !== HUMAN) return;
    if (gameOver) return;

    const idx = Number(e.currentTarget.dataset.index);
    if (board[idx] !== null) return; // already played

    board[idx] = current;
    checkGameStatus();

    // If it's AI's turn, let AI move after a tiny delay
    if (!gameOver && current === COMPUTER) {
        setTimeout(makeAiMove, 200);
    }
}

function checkGameStatus() {
    const result = getResult(board);
    if (result.type !== "none") {
        gameOver = true;
        render(result.winLine); // highlight win line if any
        updateStatus(result);
        return;
    }

    current = current === "X" ? "O" : "X";
    render();
    updateStatus();
}

function getResult(b) {
    for (const line of WIN_LINES) {
        const [a,c,d] = line;
        if (b[a] && b[a] === b[c] && b[a] === b[d]) {
            return { type: "win", winner: b[a], winLine: line };
        }
    }
    if (b.every(x => x !== null)) {
        return { type: "draw" };
    }
    return { type: "none" };
}

function render(winLine = null) {
    const cells = boardEl.querySelectorAll(".cell");
    cells.forEach((cell, i) => {
        cell.textContent = board[i] ?? "";
        cell.classList.remove("win");
        cell.setAttribute("aria-disabled", gameOver ? "true" : "false");
    });

    if (winLine) {
        for (const i of winLine) cells[i].classList.add("win");
    }
}

function updateStatus(result = null) {
    if (!result || result.type === "none") {
        const label = current === HUMAN ? "Human" : "Computer";
        statusEl.textContent = `Turn: ${current} (${label})`;
        return;
    }
    if (result.type === "win") {
        const label = result.winner === HUMAN ? "Human" : "Computer";
        statusEl.textContent = `Winner: ${result.winner} (${label}) 🎉`;
        
        if (result.winner === HUMAN) {
            humanScore++;
            humanScoreEl.textContent = humanScore;
        } else {
            computerScore++;
            computerScoreEl.textContent = computerScore;
        }
        return;
    }
    tieScore++;
    tieScoreEl.textContent = tieScore;
    statusEl.textContent = "It's a draw :(";
}

resetBtn.addEventListener("click", init);

init();