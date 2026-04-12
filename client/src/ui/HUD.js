/**
 * HUD.js — Interface durante a corrida
 * ──────────────────────────────────────
 * Timer, voltas, lançamentos, checkpoints, $CR, reset.
 */

export class HUD {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;
    this._build();
  }

  _build() {
    const s = this.scene;
    const W = s.scale.width, H = s.scale.height;

    // Fundos
    const bg = s.add.graphics().setDepth(25);
    bg.fillStyle(0x000000, 0.82); bg.fillRect(0, 0, W, 34);
    bg.fillStyle(0x000000, 0.82); bg.fillRect(0, H - 32, W, 32);

    const st = { fontFamily: "'Courier New',monospace", fontSize: '13px' };

    this.txtLap     = s.add.text(10, 9, 'VOLTA 0/2', { ...st, color: '#FF5500' }).setDepth(30);
    this.txtLaunch  = s.add.text(185, 9, '🚀 0', { ...st, color: '#fff' }).setDepth(30);
    this.txtCR      = s.add.text(260, 9, '🪙 $CR 0', { ...st, color: '#FFD700' }).setDepth(30);
    this.txtTimer   = s.add.text(W - 10, 9, '00:00.0', { ...st, color: '#00EEFF' }).setOrigin(1, 0).setDepth(30);
    this.txtChar    = s.add.text(W / 2, 9, '', { ...st, color: '#ffffff' }).setOrigin(0.5, 0).setDepth(30);

    // Barra de força
    s.add.text(W / 2, H - 27, 'FORÇA', { fontFamily: "'Courier New',monospace", fontSize: '9px', color: '#334455' }).setOrigin(0.5).setDepth(30);
    s.add.rectangle(W / 2, H - 14, 204, 10, 0x0a0a22).setDepth(28);
    this.powerFill = s.add.rectangle(W / 2 - 100, H - 14, 0, 8, 0x44FF88).setOrigin(0, 0.5).setDepth(29);

    // CP dots (até 3)
    this.cpDots = [];
    for (let i = 0; i < 3; i++) {
      this.cpDots.push(s.add.circle(16 + i * 20, H - 15, 7, 0x111130).setDepth(30));
    }

    // Botão reset
    const reset = s.add.text(W - 10, H - 26, '[RESET +5]', {
      fontFamily: "'Courier New',monospace", fontSize: '10px', color: '#553322', padding: { x: 3, y: 2 }
    }).setOrigin(1, 0).setDepth(30).setInteractive({ cursor: 'pointer' });
    reset.on('pointerover', () => reset.setStyle({ color: '#FF5500' }));
    reset.on('pointerout',  () => reset.setStyle({ color: '#553322' }));
    this.resetBtn = reset;

    this.startMs = 0;
  }

  startTimer(ms) { this.startMs = ms; }

  /** Atualiza o timer. Chamar no update() da cena */
  tickTimer(currentMs) {
    const elapsed = currentMs - this.startMs;
    const t = Math.floor((elapsed % 1000) / 100);
    const s = Math.floor(elapsed / 1000) % 60;
    const m = Math.floor(elapsed / 60000);
    this.txtTimer.setText(`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${t}`);
  }

  setLap(current, total)    { this.txtLap.setText(`VOLTA ${current}/${total}`); }
  setLaunches(n)            { this.txtLaunch.setText(`🚀 ${n}`); }
  setCR(n)                  { this.txtCR.setText(`🪙 $CR ${n}`); }
  setPower(p)               { this.powerFill.width = p * 200; }
  setChar(name, special)    { this.txtChar.setText(`${name} · ${special}`); }

  markCheckpoint(idx, color) {
    if (this.cpDots[idx]) this.cpDots[idx].setFillStyle(color);
  }
  resetCheckpoints() {
    this.cpDots.forEach(d => d.setFillStyle(0x111130));
  }

  onReset(callback) { this.resetBtn.on('pointerdown', callback); }
}
