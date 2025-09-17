// --- GAME SETTINGS ---
const FIELD_WIDTH = 900, FIELD_HEIGHT = 500;

// --- PLAYER STATE ---
let decks = [
    [0, 1, 2, 3], // Player 1: indices in UNIT_CONFIG
    [4, 5, 6, 0], // Player 2: indices in UNIT_CONFIG
];
let activeCard = [null, null]; // Which card is currently selected [p1, p2]
let fieldUnits = []; // {unitIndex, x, y, player, hp, cooldown, targetId, ...}

// --- UI ---
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const deckEls = [document.getElementById("deck1"), document.getElementById("deck2")];
const swapModal = document.getElementById("swap-modal");
const allUnitsEl = document.getElementById("all-units");
let swappingFor = {player: null, cardIdx: null};

// --- RENDER DECKS AND CARDS ---
function renderDecks() {
    for (let p = 0; p < 2; ++p) {
        deckEls[p].innerHTML = "";
        decks[p].forEach((unitIdx, ci) => {
            const unit = UNIT_CONFIG[unitIdx];
            const card = document.createElement("div");
            card.className = "card" + (activeCard[p] === ci ? " selected" : "");
            card.onclick = () => { activeCard[p] = ci; renderDecks(); };
            card.ondblclick = () => { openSwapModal(p, ci); };
            // Unit image or shape
            const imgDiv = document.createElement("div");
            imgDiv.className = "unit-img";
            if (unit.image) {
                const img = document.createElement("img");
                img.src = unit.image;
                img.width = img.height = 40;
                imgDiv.appendChild(img);
            } else {
                imgDiv.style.background = unit.color;
                imgDiv.innerText = unit.name[0];
            }
            card.appendChild(imgDiv);
            // Info
            const nameDiv = document.createElement("div");
            nameDiv.className = "unit-name";
            nameDiv.innerText = unit.name;
            card.appendChild(nameDiv);
            // Damage/type
            const stats = document.createElement("div");
            stats.style.fontSize = "0.8em";
            stats.innerText = `${unit.type} | DMG:${unit.damage} | CD:${unit.cooldown}`;
            card.appendChild(stats);

            deckEls[p].appendChild(card);
        });
    }
}
// --- CARD SWAPPING ---
function openSwapModal(player, cardIdx) {
    swappingFor = {player, cardIdx};
    swapModal.classList.remove("hidden");
    allUnitsEl.innerHTML = "";
    UNIT_CONFIG.forEach((u, idx) => {
        const btn = document.createElement("div");
        btn.className = "unit-option";
        btn.innerHTML = `<b>${u.name}</b><br><span style="font-size:0.8em;">${u.type} | DMG:${u.damage}</span>`;
        btn.onclick = () => {
            decks[player][cardIdx] = idx;
            swapModal.classList.add("hidden");
            renderDecks();
        };
        allUnitsEl.appendChild(btn);
    });
}
document.getElementById("close-modal").onclick = () => swapModal.classList.add("hidden");

// --- GAME LOOP ---
let lastTime = Date.now();
function gameLoop() {
    let now = Date.now(), dt = (now - lastTime) / 1000; lastTime = now;
    updateUnits(dt);
    drawField();
    requestAnimationFrame(gameLoop);
}

// --- DEPLOY UNITS ---
canvas.onclick = function(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    let side = (x < FIELD_WIDTH/2) ? 0 : 1;
    if (activeCard[side] !== null) {
        let unitIdx = decks[side][activeCard[side]];
        const unit = UNIT_CONFIG[unitIdx];
        // Check cooldown for this slot
        let last = fieldUnits.filter(u => u.player === side && u.deckSlot === activeCard[side] && u.cooldown > 0);
        if (last.length === 0) {
            fieldUnits.push({
                id: Math.random().toString(36).substr(2,9), x, y, player: side, unitIndex: unitIdx, hp: unit.hp, cooldown: unit.cooldown, deckSlot: activeCard[side], t:0
            });
        }
    }
};

// --- UNIT UPDATE AND ATTACK ---
function updateUnits(dt) {
    for (let u of fieldUnits) {
        u.t += dt;
        const unit = UNIT_CONFIG[u.unitIndex];
        if (unit.type === "spell" && u.t > 0.1 && !u.didDamage) {
            // Spell: deal AoE damage and disappear
            for (let t of fieldUnits) {
                if (t.player !== u.player && dist(u, t) < 40) t.hp -= unit.damage;
            }
            u.didDamage = true; u.hp = 0;
        } else if (unit.type === "melee" || unit.type === "ranged") {
            // SEEK TARGET
            let enemies = fieldUnits.filter(t => t.player !== u.player && t.hp > 0);
            let target = enemies[0];
            let minDist = 9999;
            for (let t of enemies) {
                let d = dist(u, t);
                if (d < minDist) { minDist = d; target = t; }
            }
            if (target) {
                // Move toward or attack
                let dx = target.x - u.x, dy = target.y - u.y, d = Math.sqrt(dx*dx+dy*dy);
                if (d > 32 && unit.type === "melee") {
                    u.x += (dx/d) * unit.speed;
                    u.y += (dy/d) * unit.speed;
                } else if (d > 64 && unit.type === "ranged") {
                    u.x += (dx/d) * unit.speed;
                    u.y += (dy/d) * unit.speed;
                } else {
                    // attack (cooldown)
                    u.cooldown -= dt;
                    if (u.cooldown <= 0) {
                        target.hp -= unit.damage;
                        u.cooldown = UNIT_CONFIG[u.unitIndex].cooldown;
                    }
                }
            }
        }
    }
    // Remove dead units
    fieldUnits = fieldUnits.filter(u => u.hp > 0);
}

// --- DRAW FIELD AND UNITS ---
function drawField() {
    ctx.clearRect(0,0,FIELD_WIDTH,FIELD_HEIGHT);
    // Draw middle line
    ctx.strokeStyle = "#fff";
    ctx.beginPath(); ctx.moveTo(FIELD_WIDTH/2,0); ctx.lineTo(FIELD_WIDTH/2,FIELD_HEIGHT); ctx.stroke();
    // Draw units
    for (let u of fieldUnits) {
        const unit = UNIT_CONFIG[u.unitIndex];
        ctx.save();
        ctx.translate(u.x, u.y);
        if (unit.image) {
            let img = new Image();
            img.src = unit.image;
            ctx.drawImage(img, -20, -20, 40, 40);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, 2*Math.PI);
            ctx.fillStyle = unit.color;
            ctx.fill();
            ctx.strokeStyle = "#444";
            ctx.stroke();
            ctx.fillStyle = "#fff";
            ctx.font = "bold 14px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(unit.name[0], 0, 6);
        }
        // HP bar
        ctx.fillStyle = "#f00";
        ctx.fillRect(-20, 24, 40*u.hp/UNIT_CONFIG[u.unitIndex].hp, 6);
        ctx.strokeStyle = "#fff";
        ctx.strokeRect(-20, 24, 40, 6);

        ctx.restore();
    }
}

// --- UTIL ---
function dist(a, b) { return Math.hypot(a.x-b.x, a.y-b.y); }

// --- INIT ---
renderDecks();
gameLoop();
