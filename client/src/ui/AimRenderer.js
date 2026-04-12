/**
 * AimRenderer.js — Renderização de mira e preview de trajetória
 * ───────────────────────────────────────────────────────────────
 * Totalmente separado da lógica. Só escreve pixels.
 */

import { PHYSICS } from '../config/GameConfig.js';

export class AimRenderer {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.gfx   = scene.add.graphics().setDepth(20);
    this.power = 0;
  }

  /**
   * Desenha: linha de arrasto, dots de trajetória, seta de direção, barra de força.
   * @param {import('../core/Physics.js').Vec2} dragStart
   * @param {import('../core/Physics.js').Vec2} dragEnd
   * @param {Array<import('../core/Physics.js').Vec2>} trajectory - pontos calculados pelo Physics
   * @param {number} power  - 0 a 1
   */
  draw(dragStart, dragEnd, trajectory, power) {
    this.gfx.clear();
    this.power = power;

    const barColor = power > 0.7 ? 0xDD1100 : power > 0.4 ? 0xFF8800 : 0x44FF88;

    // Linha de arrasto (elástico)
    this.gfx.lineStyle(2, 0xFF5500, 0.45);
    this.gfx.beginPath();
    this.gfx.moveTo(dragStart.x, dragStart.y);
    this.gfx.lineTo(dragEnd.x, dragEnd.y);
    this.gfx.strokePath();

    // Dots de trajetória
    trajectory.forEach((pt, i) => {
      const alpha = 1 - (i / trajectory.length) * 0.9;
      const size  = Math.max(1.5, 4.5 - i * 0.35);
      this.gfx.fillStyle(0xffffff, alpha);
      this.gfx.fillCircle(pt.x, pt.y, size);
    });

    // Seta de direção
    const dx  = dragStart.x - dragEnd.x;
    const dy  = dragStart.y - dragEnd.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 8) {
      const nx = dx / len, ny = dy / len;
      const aLen = 56;
      const ax = dragStart.x + nx * aLen, ay = dragStart.y + ny * aLen;
      this.gfx.lineStyle(3, 0xffffff, 0.85);
      this.gfx.beginPath();
      this.gfx.moveTo(dragStart.x, dragStart.y);
      this.gfx.lineTo(ax, ay);
      this.gfx.strokePath();
      const ang = Math.atan2(ny, nx);
      this.gfx.fillStyle(0xffffff, 0.85);
      this.gfx.fillTriangle(
        ax + Math.cos(ang) * 13, ay + Math.sin(ang) * 13,
        ax + Math.cos(ang + 2.4) * 8, ay + Math.sin(ang + 2.4) * 8,
        ax + Math.cos(ang - 2.4) * 8, ay + Math.sin(ang - 2.4) * 8,
      );
    }
  }

  /** Atualiza apenas a barra de força no HUD (chamado externamente) */
  updatePowerBar(fill) {
    const w = this.power * 200;
    fill.width = w;
    fill.fillColor = this.power > 0.7 ? 0xDD1100 : this.power > 0.4 ? 0xFF8800 : 0x44FF88;
  }

  clear() { this.gfx.clear(); }
}
