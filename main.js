// --- GAME SETTINGS ---
const FIELD_WIDTH = 900, FIELD_HEIGHT = 500;
const TOWER_HP = 300;

// --- PLAYER STATE ---
let decks = [
    [0, 1, 2, 3], // Player 1: indices in UNIT_CONFIG
    [4, 5, 6, 0], // Player 2: indices in UNIT_CONFIG
];
let activeCard = [null, null];
let fieldUnits = [];
let towers = [
    { x: 80, y: FIELD_HEIGHT / 2, hp: TOWER_HP },
    { x: FIELD_WIDTH - 80, y: FIELD_HEIGHT / 2, hp: TOWER_HP }
];
let winner = null;

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
            // Damage/type/speed
            const stats = document.createElement("div");
            stats.style.fontSize = "0.8em";
            stats.innerText = `${unit.type} | DMG:${unit.damage} | SPD:${unit.speed} | CD:${unit.cooldown}`;
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
        btn.innerHTML = `<b>${u.name}</b><br>
        <span style="font-size:0.8em;">${u.type} | DMG:${u.damage} | SPD:${u.speed}</span>`;
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
    if (!winner) updateUnits(dt);
    drawField();
    requestAnimationFrame(gameLoop);
}

// --- DEPLOY UNITS ---
canvas.onclick = function(e) {
    if (winner) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    let side = (x < FIELD_WIDTH/2) ? 0 : 1;
    if (activeCard[side] !== null) {
        let unitIdx = decks[side][activeCard[side]];
        const unit = UNIT_CONFIG[unitIdx];
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
            // Damage tower if close
            let enemyTower = towers[1 - u.player];
            if (dist(u, enemyTower) < 40) enemyTower.hp -= unit.damage;
            u.didDamage = true; u.hp = 0;
        } else if (unit.type === "melee" || unit.type === "ranged") {
            let enemies = fieldUnits.filter(t => t.player !== u.player && t.hp > 0);
            let target = null, minDist = 9999;
            for (let t of enemies) {
                let d = dist(u, t);
                if (d < minDist) { minDist = d; target = t; }
            }
            // If no enemy units, target enemy tower
            if (!target) {
                target = towers[1-u.player];
                minDist = dist(u, target);
            }
            let dx = target.x - u.x, dy = target.y - u.y, d = Math.sqrt(dx*dx+dy*dy);
            let attackRange = (unit.type === "melee") ? 32 : 64;
            if (d > attackRange) {
                // Move toward
                if (d > 0.1) {
                    u.x += (dx/d) * unit.speed;
                    u.y += (dy/d) * unit.speed;
                }
            } else {
                // attack (cooldown)
                u.cooldown -= dt;
                if (u.cooldown <= 0) {
                    if (target.hp !== undefined) { // tower
                        target.hp -= unit.damage;
                    } else {
                        target.hp -= unit.damage;
                    }
                    u.cooldown = UNIT_CONFIG[u.unitIndex].cooldown;
                }
            }
        }
    }
    // Remove dead units
    fieldUnits = fieldUnits.filter(u => u.hp > 0);
    // Check win
    for (let p = 0; p < 2; ++p) {
        if (towers[p].hp <= 0 && !winner) {
            winner = p === 0 ? "Player 2" : "Player 1";
            setTimeout(() => alert(`${winner} wins! Reload to play again.`), 100);
        }
    }
}

// --- DRAW FIELD AND UNITS ---
function drawField() {
    ctx.clearRect(0,0,FIELD_WIDTH,FIELD_HEIGHT);
    // Draw middle line
    ctx.strokeStyle = "#fff";
    ctx.beginPath(); ctx.moveTo(FIELD_WIDTH/2,0); ctx.lineTo(FIELD_WIDTH/2,FIELD_HEIGHT); ctx.stroke();

    // Draw towers (big rectangles with HP bar)
    for (let p = 0; p < 2; ++p) {
        let t = towers[p];
        ctx.save();
        ctx.translate(t.x, t.y);
        // Tower base (rectangle)
        ctx.fillStyle = p === 0 ? "#45f" : "#f44";
        ctx.fillRect(-38, -48, 76, 96);
        // Tower roof
        ctx.fillStyle = "#888";
        ctx.fillRect(-44, -56, 88, 16);
        // Tower door
        ctx.fillStyle = "#222";
        ctx.fillRect(-15, 24, 30, 24);
        // Tower label
        ctx.fillStyle = "#fff";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("T", 0, 0);

        // HP bar with label
        ctx.fillStyle = "#222";
        ctx.fillRect(-40, 58, 80, 14);
        ctx.fillStyle = "#0f0";
        ctx.fillRect(-40, 58, 80*t.hp/TOWER_HP, 14);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(-40, 58, 80, 14);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`HP: ${Math.max(0, Math.floor(t.hp))}`, 0, 70);

        ctx.restore();
    }
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
    // Draw winner
    if (winner) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = "#111";
        ctx.fillRect(FIELD_WIDTH/2-130, FIELD_HEIGHT/2-40, 260, 80);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#fff";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${winner} wins!`, FIELD_WIDTH/2, FIELD_HEIGHT/2+12);
        ctx.restore();
    }
}

// --- UTIL ---
function dist(a, b) { return Math.hypot(a.x-b.x, a.y-b.y); }

// --- INIT ---
renderDecks();
gameLoop();
