/**
 * GameScene.js — Cena principal de corrida
 * ─────────────────────────────────────────
 * Orquestra: pista, tampinha, física, input, HUD, checkpoints.
 * Lógica de física → Physics.js | Input → InputManager.js | HUD → HUD.js
 */

import { GAME, PHYSICS, CHARACTERS } from '../config/GameConfig.js';
import { Vec2, resolveWorldBounds, resolveCircleRect } from '../core/Physics.js';
import { InputManager } from '../core/InputManager.js';
import { Yuki } from '../entities/Yuki.js';
import { CapCoin } from '../entities/CapCoin.js';
import { AimRenderer } from '../ui/AimRenderer.js';
import { HUD } from '../ui/HUD.js';

// Geometria da pista
const TK = {
  oPad: 40,
  iX: 188, iY: 122, iW: 424, iH: 272,
  startX: 400, startY: 442,
};

// Checkpoints: [x, y, raio, cor, label, cr]
const CPS = [
  { x: GAME.WIDTH / 2, y: (TK.oPad + TK.iY) / 2, r: 40, color: 0xFFD700, label: 'CP1', cr: 30 },
  { x: (TK.oPad + TK.iX) / 2, y: GAME.HEIGHT / 2, r: 40, color: 0x44FF88, label: 'CP2', cr: 30 },
  { x: (TK.iX + TK.iW + GAME.WIDTH - TK.oPad) / 2, y: GAME.HEIGHT / 2, r: 40, color: 0x00EEFF, label: 'CP3', cr: 30 },
];

// Bounds da área jogável
const BOUNDS = {
  x: TK.oPad + 6, y: TK.oPad + 6,
  w: GAME.WIDTH - TK.oPad * 2 - 12,
  h: GAME.HEIGHT - TK.oPad * 2 - 12,
};

// Obstáculo interno (ilha central)
const ISLAND = { x: TK.iX, y: TK.iY, w: TK.iW, h: TK.iH };

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'Game' }); }
  init(data) { this.charId = data?.charId ?? 'Yuki'; }

  create() {
    this.totalLaps = 2;
    this.racing    = false;
    this.finished  = false;

    // Personagem e tampinha
    this.character = new Yuki();
    const specs    = CHARACTERS[this.charId] ?? CHARACTERS.Yuki;
    this.cap = new CapCoin(
      this, TK.startX, TK.startY,
      specs, specs.color, specs.accentColor, this.charId[0],
    );
    this.cap.body.setSurface('ASPHALT');

    // Módulos
    this._buildTrack();
    this._buildCPGraphics();
    this.aim = new AimRenderer(this);
    this.hud = new HUD(this);
    this.hud.setChar(this.charId, specs.special ?? '');
    this.hud.onReset(() => this._resetCap(true));

    // Input
    this.input_mgr = new InputManager(
      this,
      ({ dragStart, dragEnd }) => this._doLaunch(dragStart, dragEnd),
      ({ dragStart, dragEnd, power }) => this._onAiming(dragStart, dragEnd, power),
      () => this.aim.clear(),
    );

    this._startCountdown();
  }

  // ── Pista ────────────────────────────────────────────────────────
  _buildTrack() {
    const g = this.add.graphics();
    const { oPad, iX, iY, iW, iH } = TK;
    const W = GAME.WIDTH, H = GAME.HEIGHT;

    g.fillStyle(0x020110); g.fillRect(0, 0, W, H);
    g.lineStyle(1, 0xffffff, 0.02);
    for (let x = 0; x < W + 80; x += 44) {
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x - 30, H); g.strokePath();
    }

    // Asfalto
    g.fillStyle(0x131320); g.fillRoundedRect(oPad, oPad, W - oPad * 2, H - oPad * 2, 48);
    // Ilha de grama
    g.fillStyle(0x0a1f0e); g.fillRoundedRect(iX, iY, iW, iH, 32);
    // Kerbas
    g.lineStyle(7, 0xDD1100, 1); g.strokeRoundedRect(oPad + 1, oPad + 1, W - oPad * 2 - 2, H - oPad * 2 - 2, 48);
    g.lineStyle(7, 0xDD1100, 1); g.strokeRoundedRect(iX + 1, iY + 1, iW - 2, iH - 2, 32);

    // Linhas tracejadas
    g.lineStyle(2, 0xFFFF44, 0.2);
    const topY = (oPad + iY) / 2, botY = (iY + iH + H - oPad) / 2;
    const leftX = (oPad + iX) / 2, rightX = (iX + iW + W - oPad) / 2;
    for (let x = iX + 28; x < iX + iW - 28; x += 32) {
      g.beginPath(); g.moveTo(x, topY); g.lineTo(x + 16, topY); g.strokePath();
      g.beginPath(); g.moveTo(x, botY); g.lineTo(x + 16, botY); g.strokePath();
    }
    for (let y = iY + 22; y < iY + iH - 22; y += 28) {
      g.beginPath(); g.moveTo(leftX, y); g.lineTo(leftX, y + 14); g.strokePath();
      g.beginPath(); g.moveTo(rightX, y); g.lineTo(rightX, y + 14); g.strokePath();
    }

    // Label da ilha
    this.add.text(iX + iW / 2, iY + iH / 2, 'CapRush\nCIRCUITO', {
      fontFamily: "Impact,'Arial Black',sans-serif", fontSize: '22px',
      color: '#12261a', align: 'center',
    }).setOrigin(0.5);

    // Chegada xadrez
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      g.fillStyle((r + c) % 2 === 0 ? 0xffffff : 0x000000);
      g.fillRect(TK.startX - 24 + c * 10, iY + iH + 4 + r * 8, 10, 8);
    }

    // Setas de direção
    const ar = { fontFamily: "'Courier New',monospace", fontSize: '13px', color: '#ffffff08' };
    this.add.text(W / 2, topY, '← ← ← ← ←', ar).setOrigin(0.5);
    this.add.text(W / 2, botY, '→ → → → →', ar).setOrigin(0.5);
    this.add.text(leftX,  H / 2, '↑\n↑\n↑', { ...ar, align: 'center' }).setOrigin(0.5);
    this.add.text(rightX, H / 2, '↓\n↓\n↓', { ...ar, align: 'center' }).setOrigin(0.5);
  }

  // ── Checkpoints visuais ──────────────────────────────────────────
  _buildCPGraphics() {
    this.cpGfx = CPS.map((cp, i) => {
      const gfx = this.add.graphics();
      gfx.lineStyle(3, cp.color, 0.8); gfx.strokeRect(-30, -30, 60, 60);
      gfx.lineStyle(1, cp.color, 0.3); gfx.strokeCircle(0, 0, 22);
      gfx.setPosition(cp.x, cp.y).setDepth(5);
      this.tweens.add({ targets: gfx, alpha: .15, duration: 700 + i * 80, yoyo: true, repeat: -1 });
      this.add.text(cp.x, cp.y, cp.label, {
        fontFamily: "'Courier New',monospace", fontSize: '9px', color: '#ffffff33',
      }).setOrigin(0.5).setDepth(6);
      return gfx;
    });
  }

  // ── Lançamento ───────────────────────────────────────────────────
  _doLaunch(dragStart, dragEnd) {
    if (!this.racing || this.finished || !this.cap.body.stopped) return;
    this.cap.body.launch(dragStart, dragEnd);
    this.character.addLaunch();
    this.hud.setLaunches(this.character.launches);
    this.aim.clear();
    this.cameras.main.flash(55, 255, 120, 50);
  }

  // ── Aiming preview ───────────────────────────────────────────────
  _onAiming(dragStart, dragEnd, power) {
    if (!this.racing || !this.cap.body.stopped) return;
    const traj = this.cap.body.previewTrajectory(dragStart, dragEnd, 14, 0.08);
    this.aim.draw(dragStart, dragEnd, traj, power);
    this.hud.setPower(power);
  }

  // ── Reset ────────────────────────────────────────────────────────
  _resetCap(penalty = false) {
    if (penalty) {
      this.character.launches += 5;
      this.hud.setLaunches(this.character.launches);
    }
    this.cap.reset(TK.startX, TK.startY);
  }

  // ── Countdown ────────────────────────────────────────────────────
  _startCountdown() {
    this.input_mgr.disable();
    const steps = ['3', '2', '1', 'VÁ!'];
    let i = 0;
    const txt = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 55, '3', {
      fontFamily: "Impact,'Arial Black',sans-serif",
      fontSize: '108px', color: '#FF5500', stroke: '#000', strokeThickness: 14,
    }).setOrigin(0.5).setDepth(55);

    this.time.addEvent({ delay: 900, repeat: 3, callback: () => {
      i++;
      if (i < steps.length) {
        txt.setText(steps[i]);
        txt.setColor(i === 3 ? '#00EEFF' : '#FF5500');
        this.tweens.add({ targets: txt, scale: { from: 1.6, to: 1 }, duration: 340, ease: 'Back.Out' });
      } else {
        txt.destroy();
        this.racing = true;
        this.character.startTime = Date.now();
        this.hud.startTimer(this.time.now);
        this.input_mgr.enable();
      }
    }});
  }

  // ── Update loop ──────────────────────────────────────────────────
  update(time, delta) {
    if (!this.racing || this.finished) return;

    const dt = delta / 1000; // ms → s
    this.hud.tickTimer(time);

    // Avança física
    this.cap.body.step(dt);

    // Colisões
    const bounced = resolveWorldBounds(this.cap.body, this.cap.radius, BOUNDS);
    const hitIsland = resolveCircleRect(this.cap.body, this.cap.radius, ISLAND);
    if (bounced || hitIsland) {
      const boost = this.character.onBounce?.(this.cap.body);
      if (boost) this.cameras.main.flash(120, 255, 200, 50);
      else this.cameras.main.shake(40, 0.004);
    }

    // Sincroniza sprite
    this.cap.sync();

    // Spin
    if (this.cap.body.vel.length() > PHYSICS.MIN_SPEED_STOP) {
      this.cap.sprite.angle = this.cap.body.angle;
    }

    // Detecta checkpoints
    const cx = this.cap.body.pos.x, cy = this.cap.body.pos.y;
    CPS.forEach((cp, i) => {
      if (!this.character.checkpointsPassed.has(i)) {
        const dist = Math.hypot(cx - cp.x, cy - cp.y);
        if (dist < cp.r) {
          this.character.passCheckpoint(i);
          this.cpGfx[i].setAlpha(0.04);
          this.hud.markCheckpoint(i, cp.color);
          this.character.crEarned += cp.cr;
          this.hud.setCR(this.character.crEarned);
          this.cameras.main.flash(150, 80, 200, 100);

          const ft = this.add.text(cp.x, cp.y - 20, `+$CR ${cp.cr}`, {
            fontFamily: "'Courier New',monospace", fontSize: '14px',
            color: '#FFD700', stroke: '#000', strokeThickness: 3,
          }).setOrigin(0.5).setDepth(50);
          this.tweens.add({ targets: ft, y: cp.y - 70, alpha: 0, duration: 1200, onComplete: () => ft.destroy() });
        }
      }
    });

    // Detecta volta
    const atStart = Math.hypot(cx - TK.startX, cy - TK.startY) < 44;
    if (atStart && this.character.completeLap(CPS.length)) {
      this.hud.setLap(this.character.laps, this.totalLaps);
      this.hud.resetCheckpoints();
      this.cpGfx.forEach(gfx => gfx.setAlpha(0.8));
      this.character.crEarned += 120;
      this.hud.setCR(this.character.crEarned);
      this.cameras.main.flash(600, 255, 180, 80);

      if (this.character.laps >= this.totalLaps) {
        this.finished = true;
        this.character.finishTime = Date.now();
        this.cap.body.stopped = true;
        this.input_mgr.disable();
        this.time.delayedCall(800, () => this.scene.start('Result', {
          time:     (this.character.getRaceTime() / 1000).toFixed(1),
          launches: this.character.launches,
          cr:       this.character.crEarned,
          rating:   this.character.getRating(this.totalLaps),
          charId:   this.charId,
        }));
      }
    }
  }
}
