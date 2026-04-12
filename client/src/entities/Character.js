/**
 * Character.js — Classe base de personagem
 * ─────────────────────────────────────────
 * Contém: specs, estado de corrida, laps, checkpoints.
 * A renderização (sprite) fica na cena que instancia o personagem.
 */

export class Character {
  /**
   * @param {string} id    - chave em CHARACTERS (ex: 'Yuki')
   * @param {Object} specs - specs do personagem (de GameConfig)
   */
  constructor(id, specs) {
    this.id    = id;
    this.specs = specs;

    // Estado de corrida
    this.laps             = 0;
    this.checkpointsPassed = new Set();
    this.launches         = 0;
    this.crEarned         = 0;
    this.finished         = false;
    this.startTime        = null;
    this.finishTime       = null;

    // Habilidade especial
    this.specialUsed     = false;
    this.specialCooldown = 0; // em voltas
  }

  /** Registra passagem por checkpoint */
  passCheckpoint(id) {
    if (!this.checkpointsPassed.has(id)) {
      this.checkpointsPassed.add(id);
      return true; // novo checkpoint
    }
    return false;
  }

  /** Registra conclusão de volta (verifica se todos CPs foram passados) */
  completeLap(totalCheckpoints) {
    if (this.checkpointsPassed.size >= totalCheckpoints) {
      this.checkpointsPassed.clear();
      this.laps++;
      this.crEarned += 120; // base por volta
      return true;
    }
    return false; // não passou por todos os checkpoints
  }

  /** Registra uso de lançamento */
  addLaunch() { this.launches++; }

  /** Calcula rating final (1-3 estrelas) */
  getRating(totalLaps) {
    if (!this.finished) return 0;
    const efficiency = Math.max(0, 36 * totalLaps - this.launches);
    if (efficiency > 24 * totalLaps) return 3;
    if (efficiency > 12 * totalLaps) return 2;
    return 1;
  }

  /** Tempo de corrida em ms */
  getRaceTime() {
    if (!this.startTime) return 0;
    const end = this.finishTime ?? Date.now();
    return end - this.startTime;
  }
}
