/**
 * InputManager.js — Captura de input do usuário
 * ───────────────────────────────────────────────
 * Gerencia arraste (mira + força), suporte a mouse e touch.
 * Emite eventos que a cena consome — não acessa Phaser diretamente.
 */

import { PHYSICS } from '../config/GameConfig.js';
import { Vec2 } from './Physics.js';

export class InputManager {
  /**
   * @param {Phaser.Scene} scene
   * @param {Function} onLaunch  - callback({ dragStart, dragEnd, power, direction })
   * @param {Function} onAiming  - callback({ dragStart, dragEnd, power }) durante arraste
   * @param {Function} onCancel  - callback()
   */
  constructor(scene, onLaunch, onAiming, onCancel) {
    this.scene    = scene;
    this.active   = false; // só aceita input quando true
    this.dragging = false;
    this.start    = null;

    scene.input.on('pointerdown', (p) => this._onDown(p));
    scene.input.on('pointermove', (p) => this._onMove(p));
    scene.input.on('pointerup',   (p) => this._onUp(p));

    this._onLaunch  = onLaunch;
    this._onAiming  = onAiming;
    this._onCancel  = onCancel;
  }

  enable()  { this.active = true; }
  disable() { this.active = false; this.dragging = false; }

  _onDown(p) {
    if (!this.active) return;
    this.dragging = true;
    this.start = new Vec2(p.x, p.y);
  }

  _onMove(p) {
    if (!this.dragging || !this.active) return;
    const end   = new Vec2(p.x, p.y);
    const dx    = this.start.x - end.x;
    const dy    = this.start.y - end.y;
    const dist  = Math.min(Math.sqrt(dx*dx + dy*dy), PHYSICS.MAX_DRAG_PX);
    const power = dist / PHYSICS.MAX_DRAG_PX;
    this._onAiming?.({ dragStart: this.start, dragEnd: end, power });
  }

  _onUp(p) {
    if (!this.dragging || !this.active) return;
    this.dragging = false;
    const end  = new Vec2(p.x, p.y);
    const dx   = this.start.x - end.x;
    const dy   = this.start.y - end.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 6) { this._onCancel?.(); return; }
    this._onLaunch?.({ dragStart: this.start, dragEnd: end });
  }
}
