// CapRush – GameConfig.js
// Constantes globais do jogo. Altere aqui para afetar todo o projeto.

export const GAME = {
  WIDTH:  800,
  HEIGHT: 520,
  FPS:    60,
  TITLE:  'CapRush – Overdrive!',
  VERSION: '0.1.0',
};

// Física base (multiplicada pelos atributos do personagem)
export const PHYSICS = {
  MAX_DRAG_PX:      165,   // distância máxima de arraste em pixels
  BASE_LAUNCH_SPEED: 740,  // px/s na força máxima com power=1.0
  DRAG_RETAIN:      0.52,  // velocidade retida por segundo (0-1)
  BOUNCE:           0.30,  // coeficiente de ricochete nas paredes
  SPIN_FACTOR:      0.022, // rotação por pixel de velocidade
  MIN_SPEED_STOP:   14,    // velocidade mínima para considerar parado
};

// Atrito por superfície (multiplicador de DRAG_RETAIN)
export const SURFACE = {
  ASPHALT: 0.92,  // asfalto — menos perda
  DIRT:    0.68,  // terra/cascalho
  SAND:    0.55,  // areia
  GRASS:   0.60,  // grama
  WET:     0.45,  // molhado/chuva
  ICE:     0.96,  // gelo — quase sem perda
};

// Specs dos personagens
export const CHARACTERS = {
  Yuki: {
    name: 'Yuki',
    species: 'Samoieda',
    personality: 'Alegre, energético, impulsivo',
    power:             1.4,
    precision:         0.6,
    friction_resistance: 0.9,
    special: 'Impulso Inercial',
    specialDesc: 'Dobra velocidade no primeiro ricochete da volta.',
    color: 0xFFFFFF,
    accentColor: 0x88CCFF,
  },
  Kenta: {
    name: 'Kenta',
    species: 'Maine Coon',
    personality: 'Calculista, estratégico',
    power:             0.8,
    precision:         1.4,
    friction_resistance: 1.0,
    special: 'Linha de Trajetória Longa',
    specialDesc: 'Preview de trajetória 40% mais longa.',
    color: 0x8B6914,
    accentColor: 0xFFCC44,
  },
  Bruna: {
    name: 'Bruna',
    species: 'SRD',
    personality: 'Resiliente, competitiva',
    power:             1.0,
    precision:         1.0,
    friction_resistance: 1.1,
    special: 'Estabilidade em Terreno Irregular',
    specialDesc: 'Perde 30% menos velocidade em terra e areia.',
    color: 0x5C3317,
    accentColor: 0xFF8833,
  },
  Tapz: {
    name: 'Tapz',
    species: 'Golden Retriever',
    personality: 'Gentil, leve, precisa',
    power:             0.7,
    precision:         1.2,
    friction_resistance: 1.3,
    special: 'Gasto de Velocidade Reduzido em Curvas',
    specialDesc: 'Mantém 25% mais velocidade em curvas fechadas.',
    color: 0xFFCC66,
    accentColor: 0xFFEEAA,
  },
};

// Pistas disponíveis
export const TRACKS = {
  TEST: {
    id: 'test',
    name: 'Pista de Teste',
    surface: 'ASPHALT',
    laps: 2,
    checkpoints: 3,
  },
};
