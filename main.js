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
// --- INIT ---
renderDecks();
gameLoop();
