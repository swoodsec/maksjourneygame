'use strict';

// =============================================================================
// MAKS' JOURNEY  –  TMNT-style forest brawler
// Controls: Arrow Keys = move (up/down = depth), X/Space = jump, Z = attack
// =============================================================================

const CFG = {
  W: 800, H: 450,
  SCALE: 2,
  // Ground corridor – characters walk between these Y values (world depth)
  GROUND_TOP: 285,
  GROUND_BOT: 410,
  GRAVITY: 2000,     // jump gravity (px/s²)
  JUMP_VEL: -720,    // initial jump velocity (px/s, negative = up)
  PLAYER_SPEED: 165,
  ENEMY_SPEED: 130,  // bumped from 95 — fast & aggressive
  AREA_W: 1800,      // pixel width of each area
  SPRITE_SIZE: 68,   // PixelLab character canvas size (68×68 with animation padding)
  BOSS_SIZE: 112,    // spider boss canvas (112×112 PixelLab quadruped)
  BOSS_HP: 500,
  BOSS_SPEED: 115,   // bumped from 50 — spider now actually pressures the player
  WEB_SPEED: 520,    // bumped from 160 — webs match bullet speed, jump-or-die
  BULLET_SPEED: 520, // sausage bullet px/s
  BULLET_RATE: 0.12, // seconds between shots when holding Z (gun mode)
  BULLET_DAMAGE: 18,
};

// PixelLab asset IDs – filled by download-assets.sh after generation completes
const ASSET_IDS = {
  maks:   '7c3d5749-96cc-4b3d-bb01-36bf25f3e221',
  enemy:  '78af6659-ead7-43f0-9aee-8c46ebf38b1f',
  owl:    '8407df99-a331-41cf-b00c-d820af3e3c81',
  key:    '64e2c495-e19e-49dd-ba37-c2876d496d8e',
  door:   'ee6f263c-3320-4da3-92ad-1728b081a18d',
  logpile:'e84fdbd9-e76e-4587-b91a-8f24b9f6c9c9',
};

// =============================================================================
// BOOT
// =============================================================================
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() { this.scene.start('Preload'); }
}

// =============================================================================
// PRELOAD  –  loads local sprites; generates placeholder textures for any missing
// =============================================================================
class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  preload() {
    const cx = CFG.W / 2, cy = CFG.H / 2;
    this.add.text(cx, cy - 50, "MAKS' JOURNEY", {
      fontSize: '28px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);
    const loadText = this.add.text(cx, cy, 'Loading assets…', {
      fontSize: '12px', color: '#aaffaa', fontFamily: 'monospace'
    }).setOrigin(0.5);
    const barBg = this.add.rectangle(cx, cy + 30, 300, 14, 0x224422);
    const bar   = this.add.rectangle(cx - 150, cy + 30, 0, 14, 0x44ff44).setOrigin(0, 0.5);
    this.load.on('progress', v => { bar.width = 300 * v; });
    this.load.on('complete', () => loadText.setText('Ready!'));

    // Attempt to load PixelLab-downloaded sprite sheets (placed by download-assets.sh)
    const ss = (key, path, fw = 68, fh = 68) =>
      this.load.spritesheet(key, path, { frameWidth: fw, frameHeight: fh });

    // Maks animations (east-facing 68×68 strips)
    ss('maks-idle',   'assets/sprites/maks-idle.png');
    ss('maks-walk',   'assets/sprites/maks-walk.png');
    ss('maks-run',    'assets/sprites/maks-run.png');
    ss('maks-jump',   'assets/sprites/maks-jump.png');
    ss('maks-attack', 'assets/sprites/maks-attack.png');
    ss('maks-hurt',   'assets/sprites/maks-hurt.png');
    ss('maks-death',  'assets/sprites/maks-death.png');
    // Armed Maks (PixelLab "Maks Armed" character) — populated once downloaded
    ss('maks-armed-idle', 'assets/sprites/maks-armed-idle.png');
    ss('maks-armed-walk', 'assets/sprites/maks-armed-walk.png');

    // Enemy animations (east-facing 68×68 strips)
    ss('enemy-idle',   'assets/sprites/enemy-idle.png');
    ss('enemy-walk',   'assets/sprites/enemy-walk.png');
    ss('enemy-attack', 'assets/sprites/enemy-attack.png');
    ss('enemy-block',  'assets/sprites/enemy-block.png');
    ss('enemy-hurt',   'assets/sprites/enemy-hurt.png');
    ss('enemy-death',  'assets/sprites/enemy-death.png');
    ss('enemy-jump',   'assets/sprites/enemy-jump.png');

    ss('owl', 'assets/sprites/owl.png', 48, 48);

    // Boss spider (112×112 canvas)
    ss('spider-idle',   'assets/sprites/spider-idle.png',   112, 112);
    ss('spider-walk',   'assets/sprites/spider-walk.png',   112, 112);
    ss('spider-attack', 'assets/sprites/spider-attack.png', 112, 112);
    ss('spider-hurt',   'assets/sprites/spider-hurt.png',   112, 112);
    ss('spider-death',  'assets/sprites/spider-death.png',  112, 112);

    this.load.image('key',       'assets/sprites/key.png');
    this.load.image('door',      'assets/sprites/door.png');
    this.load.image('door-open', 'assets/sprites/door-open.png');
    this.load.image('logpile',   'assets/sprites/logpile.png');
    this.load.image('machinegun','assets/sprites/machinegun.png');
    this.load.image('web-blob', 'assets/sprites/web-blob.png');
    this.load.image('sausage-bullet', 'assets/sprites/sausage-bullet.png');
    this.load.image('sausage-boomerang', 'assets/sprites/sausage-boomerang.png');

    // Maks throwing animation (PixelLab throw-object, 9 frames)
    ss('maks-throw', 'assets/sprites/maks-throw.png');

    // Scenic forest decorations (PixelLab objects)
    this.load.image('forest-backdrop', 'assets/sprites/forest-backdrop.png');
    this.load.image('big-tree',        'assets/sprites/big-tree.png');
    this.load.image('pine-tree',       'assets/sprites/pine-tree.png');
    this.load.image('boulder',         'assets/sprites/boulder.png');
    this.load.image('fern',            'assets/sprites/fern.png');
    this.load.image('mushroom',        'assets/sprites/mushroom.png');
    this.load.image('deer',            'assets/sprites/deer.png');
    this.load.image('rabbit',          'assets/sprites/rabbit.png');

    // PixelLab Wang tileset tiles (individually extracted)
    this.load.image('tile-grass',         'assets/tilesets/tile-grass.png');
    this.load.image('tile-dirt',          'assets/tilesets/tile-dirt.png');
    this.load.image('tile-grass-to-dirt', 'assets/tilesets/tile-grass-to-dirt.png');
    this.load.image('tile-dirt-to-grass', 'assets/tilesets/tile-dirt-to-grass.png');
    this.load.image('tile-corner-tl',     'assets/tilesets/tile-corner-tl.png');
    this.load.image('tile-corner-tr',     'assets/tilesets/tile-corner-tr.png');
    this.load.image('tile-corner-bl',     'assets/tilesets/tile-corner-bl.png');
    this.load.image('tile-corner-br',     'assets/tilesets/tile-corner-br.png');
    this.load.spritesheet('tiles-pro', 'assets/tilesets/forest-tiles-pro.png',
      { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    this._genPlaceholders();
    this._setupAnims();
    this.scene.start('Cutscene');
  }

  _genPlaceholders() {
    const t = this.textures;
    const g = this.make.graphics({ add: false });

    // Helper: draw a humanoid silhouette strip with walk-cycle offset
    const charSheet = (key, bodyColor, headColor, frames, w = 68, h = 68) => {
      if (t.exists(key)) return;
      g.clear();
      for (let i = 0; i < frames; i++) {
        const ox = i * w;
        const phase = (i / frames) * Math.PI * 2;
        const legSwing = Math.sin(phase) * 6;

        // Body
        g.fillStyle(bodyColor);
        g.fillRect(ox + 16, h * 0.38, 16, 20);
        // Head
        g.fillStyle(headColor);
        g.fillCircle(ox + 24, h * 0.22, 9);
        // Left leg
        g.fillStyle(bodyColor);
        g.fillRect(ox + 14, h * 0.62, 7, 14 + legSwing);
        // Right leg
        g.fillRect(ox + 22, h * 0.62, 7, 14 - legSwing);
        // Arms (swing opposite legs)
        g.fillRect(ox + 9,  h * 0.40, 6, 14 - legSwing * 0.5);
        g.fillRect(ox + 32, h * 0.40, 6, 14 + legSwing * 0.5);
      }
      g.generateTexture(key, frames * w, h);
    };

    // Maks – auburn/brown tones, red hair
    charSheet('maks-idle',   0x8B4513, 0xC68642, 4);
    charSheet('maks-walk',   0x8B4513, 0xC68642, 4);
    charSheet('maks-run',    0x8B4513, 0xC68642, 4);
    // Jump: spread-eagle pose
    if (!t.exists('maks-jump')) {
      g.clear();
      for (let i = 0; i < 4; i++) {
        const ox = i * 48;
        const rise = i < 2 ? i * 4 : (3 - i) * 4;
        g.fillStyle(0x8B4513);
        g.fillRect(ox + 16, 18 - rise, 16, 20);
        g.fillStyle(0xC68642);
        g.fillCircle(ox + 24, 12 - rise, 9);
        g.fillStyle(0x8B4513);
        g.fillRect(ox + 4,  22 - rise, 8, 10);  // arms out
        g.fillRect(ox + 36, 22 - rise, 8, 10);
        g.fillRect(ox + 10, 38 - rise, 8, 14);  // legs
        g.fillRect(ox + 28, 38 - rise, 8, 14);
      }
      g.generateTexture('maks-jump', 192, 48);
    }
    // Attack: lunge with extended arms (nunchuck swing)
    if (!t.exists('maks-attack')) {
      g.clear();
      for (let i = 0; i < 4; i++) {
        const ox = i * 48;
        const ext = i === 1 || i === 2 ? 12 : 4;
        g.fillStyle(0x8B4513);
        g.fillRect(ox + 16, 17, 16, 20);
        g.fillStyle(0xC68642);
        g.fillCircle(ox + 24, 11, 9);
        // Extended punching arm
        g.fillStyle(0x8B4513);
        g.fillRect(ox + 32, 20, ext, 6);
        // Sausage nunchuck tip (warm orange)
        g.fillStyle(0xD2691E);
        g.fillCircle(ox + 32 + ext + 4, 23, 5);
        // Back arm
        g.fillRect(ox + 6, 22, 8, 10);
        g.fillRect(ox + 12, 38, 8, 12);
        g.fillRect(ox + 26, 38, 8, 12);
      }
      g.generateTexture('maks-attack', 192, 48);
    }
    if (!t.exists('maks-hurt')) {
      g.clear();
      for (let i = 0; i < 2; i++) {
        const ox = i * 48;
        g.fillStyle(0xFF6347);
        g.fillRect(ox + 13, 17, 18, 20);
        g.fillStyle(0xFF8C69);
        g.fillCircle(ox + 24, 11, 9);
        g.fillStyle(0xFF6347);
        g.fillRect(ox + 6, 18, 6, 14);
        g.fillRect(ox + 36, 18, 6, 14);
        g.fillRect(ox + 13, 38, 8, 12);
        g.fillRect(ox + 27, 38, 8, 12);
      }
      g.generateTexture('maks-hurt', 96, 48);
    }
    if (!t.exists('maks-death')) {
      g.clear();
      for (let i = 0; i < 6; i++) {
        const ox = i * 48;
        const tilt = i * 15;
        // Simplified: character progressively tilts/falls
        g.fillStyle(0x8B4513, 1 - i * 0.1);
        g.fillRect(ox + 4 + i * 2, 20 + i * 3, 40 - i * 2, 16 - i);
        g.fillStyle(0xC68642, 1 - i * 0.1);
        g.fillCircle(ox + 10 + i * 3, 14 + i * 4, 8);
      }
      g.generateTexture('maks-death', 288, 48);
    }

    // Enemy – Wehrmacht grey-green
    charSheet('enemy-idle',   0x4B5320, 0x8B7355, 4);
    charSheet('enemy-walk',   0x4B5320, 0x8B7355, 4);
    charSheet('enemy-jump',   0x4B5320, 0x8B7355, 9);  // overridden by PixelLab
    if (!t.exists('enemy-attack')) {
      g.clear();
      for (let i = 0; i < 4; i++) {
        const ox = i * 48;
        const ext = i === 2 ? 14 : 4;
        g.fillStyle(0x3B4320);
        g.fillRect(ox + 16, 17, 16, 20);
        g.fillStyle(0x7B6345);
        g.fillCircle(ox + 24, 11, 9);
        // Helmet highlight
        g.fillStyle(0x2B3320);
        g.fillRect(ox + 15, 4, 18, 8);
        g.fillStyle(0x3B4320);
        g.fillRect(ox + 32, 20, ext, 6);
        g.fillStyle(0x6B6B6B);
        g.fillCircle(ox + 32 + ext + 3, 23, 4);
        g.fillStyle(0x3B4320);
        g.fillRect(ox + 6, 22, 8, 10);
        g.fillRect(ox + 12, 38, 8, 12);
        g.fillRect(ox + 26, 38, 8, 12);
      }
      g.generateTexture('enemy-attack', 192, 48);
    }
    // Block: crouch + raised arm guard
    if (!t.exists('enemy-block')) {
      g.clear();
      for (let i = 0; i < 2; i++) {
        const ox = i * 48;
        g.fillStyle(0x808080);  // grey shield tint
        g.fillRect(ox + 10, 22, 28, 18);
        g.fillStyle(0x7B6345);
        g.fillCircle(ox + 24, 16, 9);
        g.fillStyle(0x2B3320); // helmet
        g.fillRect(ox + 15, 8, 18, 8);
        g.fillStyle(0x808080);
        g.fillRect(ox + 28, 18, 8, 18);  // raised arm
        g.fillRect(ox + 8, 22, 8, 10);
        g.fillRect(ox + 14, 40, 8, 8);
        g.fillRect(ox + 26, 40, 8, 8);
      }
      g.generateTexture('enemy-block', 96, 48);
    }
    if (!t.exists('enemy-hurt')) {
      g.clear();
      for (let i = 0; i < 2; i++) {
        const ox = i * 48;
        g.fillStyle(0xFF8C00, 0.9);
        g.fillRect(ox + 14, 17, 18, 20);
        g.fillStyle(0xA09060);
        g.fillCircle(ox + 24, 11, 9);
        g.fillStyle(0x2B3320);
        g.fillRect(ox + 15, 4, 18, 8);
        g.fillStyle(0xFF8C00, 0.9);
        g.fillRect(ox + 6, 22, 8, 12);
        g.fillRect(ox + 35, 22, 8, 12);
        g.fillRect(ox + 13, 38, 8, 12);
        g.fillRect(ox + 26, 38, 8, 12);
      }
      g.generateTexture('enemy-hurt', 96, 48);
    }
    if (!t.exists('enemy-death')) {
      g.clear();
      for (let i = 0; i < 6; i++) {
        const ox = i * 48;
        g.fillStyle(0x4B5320, 1 - i * 0.1);
        g.fillRect(ox + 4 + i * 3, 22 + i * 3, 38 - i * 3, 14 - i);
        g.fillStyle(0x8B7355, 1 - i * 0.1);
        g.fillCircle(ox + 10 + i * 3, 16 + i * 4, 8);
        g.fillStyle(0x2B3320, 1 - i * 0.1);
        g.fillRect(ox + 8 + i * 3, 9 + i * 4, 16, 6);
      }
      g.generateTexture('enemy-death', 288, 48);
    }

    // Spider boss – dark grey multi-legged creature
    const spiderSheet = (key, frames, w = 112, h = 112) => {
      if (t.exists(key)) return;
      g.clear();
      for (let i = 0; i < frames; i++) {
        const ox = i * w;
        const bob = Math.sin(i * 1.2) * 3;
        // Abdomen
        g.fillStyle(0x333344);
        g.fillEllipse(ox + 40, 48 + bob, 36, 28);
        // Orange warning markings
        g.fillStyle(0xFF6600);
        g.fillEllipse(ox + 40, 48 + bob, 14, 8);
        // Cephalothorax (head/thorax)
        g.fillStyle(0x2a2a38);
        g.fillEllipse(ox + 30, 36 + bob, 24, 20);
        // Eyes (red compound)
        g.fillStyle(0xFF0000);
        g.fillCircle(ox + 25, 32 + bob, 4);
        g.fillCircle(ox + 35, 32 + bob, 4);
        g.fillStyle(0xFF4400);
        g.fillCircle(ox + 24, 32 + bob, 2);
        g.fillCircle(ox + 34, 32 + bob, 2);
        // Legs (4 pairs = 8 legs)
        g.lineStyle(2, 0x1a1a28);
        for (let leg = 0; leg < 4; leg++) {
          const ly = 36 + bob + leg * 5 - 8;
          const ext = 16 + Math.sin(i + leg) * 4;
          g.strokeLine(ox + 22, ly, ox + 22 - ext, ly + 10);
          g.strokeLine(ox + 38, ly, ox + 38 + ext, ly + 10);
        }
      }
      g.generateTexture(key, w * frames, h);
    };
    spiderSheet('spider-idle',   4);
    spiderSheet('spider-walk',   6);
    spiderSheet('spider-attack', 4);
    spiderSheet('spider-hurt',   3);
    spiderSheet('spider-death',  6);

    // Machine gun pickup
    if (!t.exists('machinegun')) {
      g.clear();
      g.fillStyle(0x4A5D23);
      g.fillRect(4, 18, 36, 10);   // receiver
      g.fillStyle(0x5B3E1E);
      g.fillRect(14, 26, 12, 10);  // grip
      g.fillStyle(0x4A5D23);
      g.fillRect(0, 22, 8, 4);     // barrel
      g.fillRect(16, 10, 12, 12);  // drum mag
      g.generateTexture('machinegun', 48, 40);
    }

    // Web projectile
    if (!t.exists('web-blob')) {
      g.clear();
      g.fillStyle(0xEEEEFF, 0.85);
      g.fillCircle(16, 16, 10);
      g.lineStyle(1, 0xCCCCEE, 0.6);
      g.strokeLine(8, 8, 24, 24);
      g.strokeLine(24, 8, 8, 24);
      g.strokeLine(16, 6, 16, 26);
      g.generateTexture('web-blob', 32, 32);
    }

    // Sausage bullet
    if (!t.exists('sausage-bullet')) {
      g.clear();
      g.fillStyle(0xD4956A);
      g.fillEllipse(16, 8, 28, 12);
      g.fillStyle(0xB87055);
      g.fillEllipse(4, 8, 6, 10);
      g.fillEllipse(28, 8, 6, 10);
      // Speed lines
      g.lineStyle(1, 0xFF8844, 0.7);
      g.strokeLine(0, 5, 5, 5);
      g.strokeLine(0, 11, 5, 11);
      g.generateTexture('sausage-bullet', 32, 16);
    }

    // Sausage boomerang (curved sausage, sized for spinning)
    if (!t.exists('sausage-boomerang')) {
      g.clear();
      // Curved body using two ellipses + a glowing yellow tip
      g.fillStyle(0xC97A3F);
      g.fillEllipse(24, 16, 32, 14);
      g.fillEllipse(24, 28, 32, 14);
      g.fillStyle(0xE5A969);
      g.fillEllipse(24, 18, 24, 6);
      // Glow ends
      g.fillStyle(0xFFE066);
      g.fillCircle(8, 22, 5);
      g.fillCircle(40, 22, 5);
      g.generateTexture('sausage-boomerang', 48, 48);
    }

    // Owl – brown/white, friendly
    if (!t.exists('owl')) {
      g.clear();
      for (let i = 0; i < 4; i++) {
        const ox = i * 32;
        const bob = i % 2 === 0 ? 0 : 2;
        // Body
        g.fillStyle(0x8B6914);
        g.fillEllipse(ox + 16, 22 + bob, 20, 24);
        // Head
        g.fillStyle(0xD4A857);
        g.fillCircle(ox + 16, 11 + bob, 10);
        // Eyes
        g.fillStyle(0xFF8C00);
        g.fillCircle(ox + 11, 10 + bob, 4);
        g.fillCircle(ox + 21, 10 + bob, 4);
        g.fillStyle(0x000000);
        g.fillCircle(ox + 11, 10 + bob, 2);
        g.fillCircle(ox + 21, 10 + bob, 2);
        // Beak
        g.fillStyle(0xFFAA00);
        g.fillTriangle(ox + 13, 14 + bob, ox + 19, 14 + bob, ox + 16, 18 + bob);
        // Wings
        g.fillStyle(0x7B5814);
        g.fillRect(ox + 2, 18 + bob, 6, 12);
        g.fillRect(ox + 24, 18 + bob, 6, 12);
        // Hat
        g.fillStyle(0x222266);
        g.fillRect(ox + 9, 2 + bob, 14, 8);
        g.fillRect(ox + 6, 8 + bob, 20, 3);
      }
      g.generateTexture('owl', 128, 32);
    }

    // Collectible key
    if (!t.exists('key')) {
      g.clear();
      g.fillStyle(0xFFD700);
      g.fillCircle(12, 10, 8);
      g.lineStyle(2, 0xFFA500);
      g.strokeCircle(12, 10, 8);
      g.fillStyle(0xFFD700);
      g.fillRect(10, 17, 4, 13);
      g.fillRect(10, 21, 9, 3);
      g.fillRect(10, 26, 7, 3);
      g.generateTexture('key', 32, 32);
    }

    // Tree-door
    if (!t.exists('door')) {
      g.clear();
      // Tree trunk surround
      g.fillStyle(0x4A2B0A);
      g.fillRect(0, 0, 88, 128);
      g.fillStyle(0x7B4E1F);
      g.fillRect(6, 6, 76, 118);
      // Wood grain
      g.lineStyle(1, 0x5C3917, 0.4);
      for (let y = 20; y < 120; y += 18) g.strokeLine(6, y, 82, y);
      // Door panels
      g.fillStyle(0x6B3E1A);
      g.fillRect(8, 8, 34, 55);
      g.fillRect(46, 8, 34, 55);
      g.fillRect(8, 67, 72, 55);
      // Iron frame
      g.lineStyle(2, 0x2A1A0A);
      g.strokeRect(8, 8, 72, 114);
      g.strokeLine(44, 8, 44, 122);
      g.strokeLine(8, 66, 80, 66);
      // Iron hinges
      g.fillStyle(0x888888);
      g.fillRect(8, 18, 10, 8);
      g.fillRect(8, 96, 10, 8);
      g.fillRect(70, 18, 10, 8);
      g.fillRect(70, 96, 10, 8);
      // Keyhole
      g.fillStyle(0xFFD700);
      g.fillCircle(44, 75, 6);
      g.fillRect(41, 75, 6, 10);
      g.generateTexture('door', 88, 128);
    }

    // Open tree-door — archway showing dark passage through
    if (!t.exists('door-open')) {
      g.clear();
      // Tree trunk surround (same as closed)
      g.fillStyle(0x4A2B0A);
      g.fillRect(0, 0, 88, 128);
      g.fillStyle(0x7B4E1F);
      g.fillRect(6, 6, 76, 118);
      g.lineStyle(1, 0x5C3917, 0.4);
      for (let y = 20; y < 120; y += 18) g.strokeLine(6, y, 82, y);
      // Dark archway interior
      g.fillStyle(0x080a0a);
      g.fillRect(20, 30, 48, 90);
      // Inner glow
      g.fillStyle(0x1f4a2a, 0.65);
      g.fillEllipse(44, 75, 32, 50);
      // Open door panel swung against trunk on the left
      g.fillStyle(0x6B3E1A);
      g.fillRect(10, 30, 10, 90);
      g.lineStyle(1, 0x3a200d);
      g.strokeRect(10, 30, 10, 90);
      g.generateTexture('door-open', 88, 128);
    }

    // Log pile
    if (!t.exists('logpile')) {
      g.clear();
      const drawLog = (y, w, x0) => {
        g.fillStyle(0x6B3A1F);
        g.fillRect(x0, y, w, 16);
        g.fillStyle(0xA0522D);
        g.fillRect(x0, y, w, 4);
        g.fillStyle(0x4A2B0F);
        g.fillCircle(x0 + 4, y + 8, 6);
        g.fillCircle(x0 + w - 4, y + 8, 6);
      };
      drawLog(26, 86, 0);
      drawLog(13, 72, 7);
      drawLog(1, 56, 15);
      g.generateTexture('logpile', 86, 44);
    }

    // Forest backdrop placeholder (replaced by PixelLab forest-backdrop when loaded)
    if (!t.exists('forest-backdrop')) {
      const BW = 256, BH = 256;
      g.clear();
      g.fillGradientStyle(0x335544, 0x335544, 0x1a3322, 0x1a3322, 1);
      g.fillRect(0, 0, BW, BH);
      g.fillStyle(0x0a1a10);
      for (let x = 0; x < BW; x += 35) {
        g.fillTriangle(x + 17, 60 + (x % 40), x - 5, BH, x + 40, BH);
      }
      g.fillStyle(0x1a3322);
      for (let x = 8; x < BW; x += 50) {
        g.fillTriangle(x + 20, 100 + (x % 30), x - 5, BH, x + 50, BH);
      }
      g.generateTexture('forest-backdrop', BW, BH);
    }

    // Tree/rock/wildlife placeholders (overridden by PixelLab assets when loaded)
    if (!t.exists('big-tree')) {
      g.clear();
      g.fillStyle(0x4A2B0A);
      g.fillRect(58, 70, 16, 60);
      g.fillStyle(0x2c5a1a);
      g.fillCircle(64, 50, 50);
      g.fillStyle(0x1f4012);
      g.fillCircle(48, 40, 28);
      g.fillCircle(82, 42, 26);
      g.generateTexture('big-tree', 128, 128);
    }
    if (!t.exists('pine-tree')) {
      g.clear();
      g.fillStyle(0x4A2B0A);
      g.fillRect(42, 70, 12, 26);
      g.fillStyle(0x1d3a14);
      g.fillTriangle(48, 0, 12, 50, 84, 50);
      g.fillTriangle(48, 20, 16, 70, 80, 70);
      g.generateTexture('pine-tree', 96, 96);
    }
    if (!t.exists('boulder')) {
      g.clear();
      g.fillStyle(0x707070);
      g.fillEllipse(28, 44, 50, 36);
      g.fillEllipse(48, 38, 32, 28);
      g.fillStyle(0x556644);
      g.fillEllipse(28, 28, 24, 8);
      g.generateTexture('boulder', 64, 64);
    }
    if (!t.exists('fern')) {
      g.clear();
      g.fillStyle(0x2a6a1c);
      for (let i = 0; i < 6; i++) {
        const a = Math.PI * (0.2 + i * 0.12);
        const ex = 24 + Math.cos(a) * 22, ey = 40 - Math.sin(a) * 22;
        g.fillTriangle(24, 44, ex - 3, ey, ex + 3, ey);
      }
      g.generateTexture('fern', 48, 48);
    }
    if (!t.exists('mushroom')) {
      g.clear();
      g.fillStyle(0xEEEEEE);
      g.fillRect(10, 28, 6, 14);
      g.fillRect(28, 30, 5, 12);
      g.fillStyle(0xCC2222);
      g.fillEllipse(13, 26, 18, 12);
      g.fillEllipse(31, 28, 14, 10);
      g.fillStyle(0xFFFFFF);
      g.fillCircle(10, 24, 1.5);
      g.fillCircle(16, 26, 1.5);
      g.fillCircle(31, 26, 1.5);
      g.generateTexture('mushroom', 48, 48);
    }
    if (!t.exists('deer')) {
      g.clear();
      g.fillStyle(0x8B5A2B);
      g.fillRect(16, 26, 36, 18);   // body
      g.fillRect(20, 42, 4, 16);    // legs
      g.fillRect(46, 42, 4, 16);
      g.fillRect(28, 42, 4, 16);
      g.fillRect(38, 42, 4, 16);
      g.fillCircle(54, 24, 7);      // head
      g.fillStyle(0x6B3E1A);
      g.fillTriangle(50, 18, 54, 8, 58, 18);  // antlers
      g.fillTriangle(54, 18, 58, 6, 62, 18);
      g.generateTexture('deer', 64, 64);
    }
    if (!t.exists('rabbit')) {
      g.clear();
      g.fillStyle(0x9C7B4A);
      g.fillEllipse(16, 22, 18, 10);  // body
      g.fillCircle(22, 18, 6);        // head
      g.fillRect(20, 8, 2, 8);        // ears
      g.fillRect(24, 8, 2, 8);
      g.fillStyle(0xFFFFFF);
      g.fillCircle(8, 22, 3);         // tail
      g.generateTexture('rabbit', 32, 32);
    }

    // Ground tile
    if (!t.exists('ground-tile')) {
      g.clear();
      g.fillStyle(0x2E6B1A);
      g.fillRect(0, 0, 32, 20);
      g.fillStyle(0x3D8B22, 0.6);
      g.fillRect(3, 2, 8, 4);
      g.fillRect(18, 3, 6, 3);
      g.fillStyle(0x4A2B0A);
      g.fillRect(0, 10, 32, 10);
      g.fillStyle(0x3A200A, 0.5);
      g.fillRect(4, 11, 12, 3);
      g.fillRect(20, 12, 8, 2);
      g.generateTexture('ground-tile', 32, 20);
    }

    g.destroy();
  }

  _setupAnims() {
    const A = this.anims;
    if (A.exists('maks-idle')) return;

    const mk = (key, tex, end, rate, repeat = -1) =>
      A.create({ key, frames: A.generateFrameNumbers(tex ?? key, { start: 0, end }), frameRate: rate, repeat });

    mk('maks-idle',   'maks-idle',   7,  6);      // 8 frames fight-stance-idle (pending)
    mk('maks-walk',   'maks-walk',   3,  9);      // 4 frames real walk
    mk('maks-run',    'maks-run',    3, 12);      // 4 frames real run
    mk('maks-jump',   'maks-jump',   8, 12,  0);  // 9 frames real jump
    mk('maks-attack', 'maks-attack', 5, 16,  0);  // 6 frames real cross-punch
    mk('maks-hurt',   'maks-hurt',   5, 10,  0);  // 6 frames real taking-punch
    mk('maks-death',  'maks-death',  6,  9,  0);  // 7 frames real falling-back-death
    // throw-object animation — 7 frames real
    if (this.textures.exists('maks-throw')) {
      mk('maks-throw', 'maks-throw', 6, 16, 0);  // 7 frames real throw-object
    } else {
      mk('maks-throw', 'maks-attack', 5, 18, 0);
    }

    // Armed Maks animations — only created if the PixelLab textures actually exist
    if (this.textures.exists('maks-armed-idle')) {
      mk('maks-armed-idle', 'maks-armed-idle', 7, 6);  // 8 frames fight-stance-idle (assumed)
    }
    if (this.textures.exists('maks-armed-walk')) {
      mk('maks-armed-walk', 'maks-armed-walk', 3, 9);  // 4 frames walking-4-frames
    }

    mk('enemy-idle',   'enemy-idle',   7,  6);      // 8 frames real fight-stance-idle
    mk('enemy-walk',   'enemy-walk',   3,  9);      // 4 frames real walk
    mk('enemy-attack', 'enemy-attack', 5, 12,  0);  // 6 frames real cross-punch
    mk('enemy-block',  'enemy-block',  4,  8);      // 5 frames real crouching
    mk('enemy-hurt',   'enemy-hurt',   5, 10,  0);  // 6 frames real taking-punch
    mk('enemy-death',  'enemy-death',  6,  9,  0);  // 7 frames real falling-back-death
    mk('enemy-jump',   'enemy-jump',   8, 14,  0);  // 9 frames jumping-1 (placeholder until PixelLab)

    mk('owl-idle', 'owl', 3, 5);  // owl frames are 48×48

    mk('spider-idle',   'spider-idle',   8,  6);     // 9 frames real idle
    mk('spider-walk',   'spider-walk',   3,  8);     // 4 frames real walk-4-frames
    mk('spider-attack', 'spider-attack', 8, 12,  0); // 9 frames real attack
    mk('spider-hurt',   'spider-hurt',   2, 12,  0); // placeholder (no quadruped hurt template)
    mk('spider-death',  'spider-death',  5,  6,  0); // placeholder (no quadruped death template)
  }
}

// =============================================================================
// CUTSCENE  –  Owl intro speech bubble
// =============================================================================
class CutsceneScene extends Phaser.Scene {
  constructor() { super('Cutscene'); }

  create() {
    const W = CFG.W, H = CFG.H;

    // ── BACKGROUND LAYERS ──────────────────────────────────────────────────
    // Sky gradient (deep teal to dawn)
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a2838).setDepth(0);

    // Far parallax: scenic forest backdrop tiled
    for (let x = -32; x < W + 256; x += 256) {
      this.add.image(x + 128, 128, 'forest-backdrop')
        .setDepth(1).setAlpha(0.85);
    }

    // Atmospheric darkening over backdrop (so foreground pops)
    this.add.rectangle(W / 2, H / 2, W, H, 0x000814, 0.35).setDepth(1.5);

    // Mid-distance trees (smaller, darker, atmospheric)
    [{x:60,s:1.0},{x:160,s:0.85},{x:260,s:1.05},{x:540,s:0.9},{x:680,s:1.0}].forEach(t=>{
      this.add.image(t.x, H * 0.62, 'pine-tree')
        .setOrigin(0.5, 1).setDepth(2)
        .setAlpha(0.6).setTint(0x4a6a6a).setScale(t.s);
    });

    // ── HERO TREE on the right (the centerpiece) ──────────────────────────
    const heroTree = this.add.image(W * 0.78, H + 6, 'big-tree')
      .setOrigin(0.5, 1).setDepth(3).setScale(2.4);
    // Subtle sway animation
    this.tweens.add({ targets: heroTree, angle: 1.5, duration: 3500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Ground band (grass)
    this.add.rectangle(W / 2, H - 18, W, 50, 0x1e4a18).setDepth(2.5);
    this.add.rectangle(W / 2, H - 4, W, 18, 0x12300d).setDepth(2.6);

    // ── FOREGROUND DECORATIONS ────────────────────────────────────────────
    // Boulder mid-left, ferns + mushrooms scattered, deer back-right
    this.add.image(W * 0.06, H - 26, 'boulder').setOrigin(0.5, 1).setDepth(3.5).setScale(1.1);
    this.add.image(W * 0.45, H - 22, 'fern').setOrigin(0.5, 1).setDepth(3.6).setScale(1.0);
    this.add.image(W * 0.58, H - 22, 'mushroom').setOrigin(0.5, 1).setDepth(3.6).setScale(0.9);
    this.add.image(W * 0.36, H - 18, 'fern').setOrigin(0.5, 1).setDepth(3.6).setScale(0.85).setFlipX(true);
    this.add.image(W * 0.92, H - 22, 'fern').setOrigin(0.5, 1).setDepth(3.6).setScale(1.1);

    // Distant rabbit hopping near the tree base
    const rabbit = this.add.image(W * 0.66, H - 24, 'rabbit').setOrigin(0.5, 1).setDepth(3.7).setScale(1.1);
    this.tweens.add({ targets: rabbit, y: rabbit.y - 6, duration: 700, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });

    // ── OWL perched on a branch of the hero tree (upper right) ────────────
    // Branch nub
    this.add.rectangle(W * 0.66, H * 0.34, 30, 6, 0x4a2818).setDepth(3.9);
    const owl = this.add.sprite(W * 0.68, H * 0.32, 'owl').play('owl-idle').setScale(2.5).setDepth(4);
    this.tweens.add({ targets: owl, y: owl.y - 5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // ── MAKS standing heroically on the left ──────────────────────────────
    const maks = this.add.sprite(W * 0.18, H - 22, 'maks-idle').play('maks-idle').setScale(2.6).setDepth(4)
      .setOrigin(0.5, 1);
    this.tweens.add({ targets: maks, y: maks.y - 3, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // ── SPEECH BUBBLE — placed below subtitle, tail up-right toward owl ───
    // Bubble auto-wraps text and the owl cycles through 3 lines of advice every 3s.
    const bx = W * 0.40, by = H * 0.46;
    const bw = 320, bh = 90;  // sized for the longest line at this fontSize, wraps on smaller text
    const bubble = this.add.graphics().setDepth(5);
    bubble.fillStyle(0xFFFFF0, 0.96);
    bubble.fillRoundedRect(bx - bw / 2, by - bh / 2, bw, bh, 12);
    // Tail pointing up-right toward the owl
    bubble.fillTriangle(bx + bw * 0.30, by - bh / 2, bx + bw * 0.42, by - bh / 2, bx + bw * 0.50, by - bh / 2 - 22);
    bubble.lineStyle(2, 0x8a6a3a, 0.7);
    bubble.strokeRoundedRect(bx - bw / 2, by - bh / 2, bw, bh, 12);
    bubble.strokeTriangle(bx + bw * 0.30, by - bh / 2, bx + bw * 0.42, by - bh / 2, bx + bw * 0.50, by - bh / 2 - 22);

    const owlMessages = [
      '"Maks, you must follow the\nsausage to your destiny."',
      '"Use your sausarang to defeat\nthe soldiers of darkness\nin your quest."',
      '"Defeat your ultimate arachnid\nenemy once and for all."',
    ];

    const owlText = this.add.text(bx, by, owlMessages[0], {
      fontSize: '12px', color: '#1a0a00', fontFamily: 'monospace',
      align: 'center', fontStyle: 'italic', lineSpacing: 2,
      wordWrap: { width: bw - 28, useAdvancedWrap: true },
    }).setOrigin(0.5).setDepth(6);

    // Cycle to the next message every 3 seconds (with a brief crossfade).
    let owlMsgIdx = 0;
    const owlCycle = this.time.addEvent({
      delay: 3000, repeat: owlMessages.length - 1,
      callback: () => {
        owlMsgIdx++;
        if (owlMsgIdx >= owlMessages.length) return;
        const next = owlMessages[owlMsgIdx];
        this.tweens.add({
          targets: owlText, alpha: 0, duration: 220, ease: 'Quad.easeIn',
          onComplete: () => {
            owlText.setText(next);
            this.tweens.add({ targets: owlText, alpha: 1, duration: 240, ease: 'Quad.easeOut' });
          }
        });
      }
    });
    // Clean up the timer if the scene exits early (player presses Z).
    this.events.once('shutdown', () => owlCycle.remove(false));

    // ── STYLIZED TITLE — top of screen, layered for gold-metal look ──────
    const titleY = 50;
    // Drop shadow
    this.add.text(W / 2 + 3, titleY + 4, "MAKS' JOURNEY", {
      fontSize: '40px', color: '#000000', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10).setAlpha(0.55);
    // Bronze underlay (offset by 2)
    this.add.text(W / 2, titleY + 2, "MAKS' JOURNEY", {
      fontSize: '40px', color: '#5C3A0E', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#2d1c05', strokeThickness: 7,
    }).setOrigin(0.5).setDepth(10);
    // Gold front
    const titleFront = this.add.text(W / 2, titleY, "MAKS' JOURNEY", {
      fontSize: '40px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#3d2a05', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(11);
    // Subtle pulse + gleam
    this.tweens.add({
      targets: titleFront, scaleX: 1.025, scaleY: 1.025,
      duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Subtitle band — small banner under the title
    const subRect = this.add.rectangle(W / 2, 92, 380, 22, 0x000000, 0.55)
      .setStrokeStyle(1, 0x8a6a3a, 0.7).setDepth(10);
    this.add.text(W / 2, 92, 'The Red-Headed Hero of the Forest', {
      fontSize: '12px', color: '#FFE3A3', fontFamily: 'monospace', fontStyle: 'italic',
    }).setOrigin(0.5).setDepth(11);

    // ── BOTTOM PROMPT BAR ─────────────────────────────────────────────────
    const startTxt = this.add.text(W / 2, H - 42, '▶ PRESS Z TO BEGIN ◀', {
      fontSize: '15px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#2d1c05', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: startTxt, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 });

    this.add.text(W / 2, H - 22, '← → ↑ ↓ Move   X Jump   Z Attack   S Boomerang', {
      fontSize: '9px', color: '#88cc88', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20);

    // ── INPUT ─────────────────────────────────────────────────────────────
    let started = false;
    const go = () => { if (started) return; started = true; this.scene.start('Game'); };
    this.input.keyboard.once('keydown-Z', go);
    this.input.keyboard.once('keydown-SPACE', go);
    this.input.once('pointerdown', go);  // any tap on the game canvas
    // Mobile virtual-tap watcher
    const tapWatcher = this.time.addEvent({
      delay: 80, loop: true, callback: () => {
        if (window.__VKEYS__ && window.__VKEYS__.tap) {
          window.__VKEYS__.tap = false;
          go();
        }
      }
    });
    this.events.once('shutdown', () => tapWatcher.remove(false));
    this.time.delayedCall(14000, go);
  }
}

// =============================================================================
// GAME SCENE
// =============================================================================
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    const totalW = CFG.AREA_W * 4 + 400;

    this.cameras.main.setBounds(0, 0, totalW, CFG.H);
    this.currentArea  = 0;
    this.keysHeld     = 0;
    this.score        = 0;
    this.victoryDone  = false;
    this.gameOverDone = false;
    this.projectiles  = [];
    this.gunItems     = [];
    this.boss         = null;
    this.bossHealthBar = null;

    this._buildWorld(totalW);
    this._buildAreas();

    this.player  = new Player(this, 160, CFG.GROUND_BOT - 20);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.zKey    = this.input.keyboard.addKey('Z');
    this.xKey    = this.input.keyboard.addKey('X');
    this.sKey    = this.input.keyboard.addKey('S');
    this.boomerangs = [];

    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    this.cameras.main.setFollowOffset(-80, 0);

    this.hud = new HUD(this);
  }

  _buildWorld(totalW) {
    const TILE = 32;

    // Seeded deterministic helper used by background + scatter (avoids re-randomising each frame)
    const rng = (col, row) => ((Math.sin(col * 127.1 + row * 311.7) * 43758.5) % 1 + 1) % 1;

    // ── LAYER 0: Sky gradient (deepest) ────────────────────────────────────
    this.add.rectangle(totalW / 2, CFG.H * 0.3, totalW, CFG.H * 0.6, 0x1d3030)
      .setScrollFactor(0).setDepth(0);

    // ── LAYER 1: Far parallax — scenic forest backdrop tiled ──────────────
    // PixelLab 256×256 backdrop, scrollFactor 0.15 (slow distant)
    const backdropY = CFG.GROUND_TOP - 75;
    for (let x = -128; x < totalW; x += 256) {
      this.add.image(x + 128, backdropY, 'forest-backdrop')
        .setScrollFactor(0.15).setDepth(1).setAlpha(0.85);
    }

    // ── LAYER 2: Mid-distance trees (scrollFactor 0.55) ───────────────────
    // Mix of pine + oak silhouettes between backdrop and corridor
    for (let i = 0; i < totalW / 90; i++) {
      const tx = i * 90 + rng(i, 7) * 40;
      if (tx > totalW) break;
      const useOak  = rng(i, 11) > 0.5;
      const tex     = useOak ? 'big-tree' : 'pine-tree';
      const ty      = CFG.GROUND_TOP - 30 + rng(i, 13) * 12;
      const tint    = 0x556677 + Math.floor(rng(i, 17) * 0x222222);
      const scl     = 0.85 + rng(i, 19) * 0.25;
      this.add.image(tx, ty, tex)
        .setOrigin(0.5, 1)
        .setScrollFactor(0.55)
        .setDepth(2)
        .setAlpha(0.7)
        .setTint(tint)
        .setScale(scl);
    }

    // ── TILE-BASED GROUND MAP ──────────────────────────────────────────────
    // Layout (32px rows):
    //   Rows 4-7  (y=128-256): lush grass — above walkable corridor
    //   Row  8    (y=256-288): grass→dirt transition — top edge of path
    //   Rows 9-12 (y=288-416): dirt forest path — the walkable corridor
    //                          GROUND_TOP=285 sits in row 8; GROUND_BOT=410 in row 12
    //   Below y=416           : dark soil fill

    // Grass band (rows 4-7)
    for (let row = 4; row <= 7; row++) {
      const ty = row * TILE + TILE / 2;
      this.add.tileSprite(totalW / 2, ty, totalW, TILE, 'tile-grass').setDepth(3);
    }

    // Grass→dirt transition row (row 8)
    this.add.tileSprite(totalW / 2, 8 * TILE + TILE / 2, totalW, TILE, 'tile-grass-to-dirt').setDepth(4);

    // Dirt path rows (rows 9-12)
    for (let row = 9; row <= 12; row++) {
      const ty = row * TILE + TILE / 2;
      this.add.tileSprite(totalW / 2, ty, totalW, TILE, 'tile-dirt').setDepth(4);
    }

    // Dark soil fill below the path
    this.add.rectangle(totalW / 2, CFG.H - 4, totalW, 100, 0x1a0e05).setDepth(4);

    // ── ORGANIC GROUND SCATTER (small ferns + mushrooms instead of square tile blocks) ──
    // Grass band: occasional small ferns/mushrooms (tiny scale)
    for (let col = 0; col * TILE < totalW; col++) {
      if (rng(col, 5) < 0.12) {
        const tx = col * TILE + rng(col, 6) * 16;
        const ty = (5 + Math.floor(rng(col, 7) * 3)) * TILE + TILE * 0.9;
        const isFern = rng(col, 8) > 0.4;
        const tex    = isFern ? 'fern' : 'mushroom';
        this.add.image(tx, ty, tex)
          .setOrigin(0.5, 1).setDepth(3.5)
          .setScale(0.45 + rng(col, 9) * 0.2);
      }
    }
    // Dirt path edge: very subtle mushroom flecks near the back corridor edge
    for (let col = 0; col * TILE < totalW; col++) {
      if (rng(col, 25) < 0.06) {
        const tx = col * TILE + rng(col, 27) * 12;
        const ty = 9 * TILE + rng(col, 29) * (TILE * 0.6);
        this.add.image(tx, ty, 'mushroom')
          .setOrigin(0.5, 1).setDepth(4.5)
          .setScale(0.4 + rng(col, 31) * 0.15)
          .setAlpha(0.85);
      }
    }

    // Subtle shadow at the front edge of the path (depth line)
    this.add.rectangle(totalW / 2, CFG.GROUND_BOT + 8, totalW, 18, 0x000000, 0.28).setDepth(7);

    // ── SCENIC FOREGROUND DECORATIONS ──────────────────────────────────────
    // Big trees lining the back edge of the path corridor (depth 3.7, behind player)
    for (let i = 0; i < totalW / 240; i++) {
      const tx = 80 + i * 240 + rng(i, 23) * 80;
      if (tx > totalW - 80) break;
      const usePine = rng(i, 29) > 0.55;
      const tex     = usePine ? 'pine-tree' : 'big-tree';
      const ty      = CFG.GROUND_TOP + 8;  // root at top of path
      const scl     = 1.4 + rng(i, 31) * 0.4;
      this.add.image(tx, ty, tex)
        .setOrigin(0.5, 1)
        .setDepth(3.7)
        .setScale(scl);
    }

    // Boulders along the back edge of the corridor (depth 4.2)
    for (let i = 0; i < totalW / 360; i++) {
      const bx = 180 + i * 360 + rng(i, 41) * 100;
      if (bx > totalW - 50) break;
      const by = CFG.GROUND_TOP + 18 + rng(i, 43) * 14;
      this.add.image(bx, by, 'boulder')
        .setOrigin(0.5, 1)
        .setDepth(4.2)
        .setScale(0.9 + rng(i, 47) * 0.5);
    }

    // Ferns along path edges (front + back of corridor)
    for (let i = 0; i < totalW / 70; i++) {
      const fx = 40 + i * 70 + rng(i, 53) * 30;
      if (fx > totalW - 30) break;
      const front = rng(i, 57) > 0.5;
      const fy    = front ? CFG.GROUND_BOT + 4 : CFG.GROUND_TOP + 14;
      this.add.image(fx, fy, 'fern')
        .setOrigin(0.5, 1)
        .setDepth(front ? 8 : 3.9)
        .setScale(0.85 + rng(i, 59) * 0.3);
    }

    // Mushroom clusters scattered (rare, charming)
    for (let i = 0; i < totalW / 280; i++) {
      const mx = 120 + i * 280 + rng(i, 67) * 120;
      if (mx > totalW - 30) break;
      const my = CFG.GROUND_TOP + 22 + rng(i, 71) * (CFG.GROUND_BOT - CFG.GROUND_TOP - 30);
      this.add.image(mx, my, 'mushroom')
        .setOrigin(0.5, 1)
        .setDepth(4.6)
        .setScale(0.75 + rng(i, 73) * 0.25);
    }

    // Wildlife: deer + rabbit at rare distant positions (back of corridor)
    for (let i = 0; i < totalW / 600; i++) {
      const wx = 300 + i * 600 + rng(i, 83) * 200;
      if (wx > totalW - 80) break;
      const isDeer = rng(i, 89) > 0.55;
      const tex    = isDeer ? 'deer' : 'rabbit';
      const wy     = CFG.GROUND_TOP + 12 + rng(i, 91) * 16;
      const flip   = rng(i, 97) > 0.5;
      this.add.image(wx, wy, tex)
        .setOrigin(0.5, 1)
        .setDepth(3.8)
        .setFlipX(flip)
        .setScale(0.95);
    }
  }

  _buildAreas() {
    this.enemies  = [];
    this.doors    = [];
    this.keyItems = [];
    this.logPiles = [];  // obstacles — block movement

    for (let a = 0; a < 3; a++) {
      const ax = a * CFG.AREA_W;

      // Log pile obstacles — alternate back / front edge of the corridor along the path.
      // Each log blocks ~25px deep of the 125px corridor, forcing the player to slide
      // around to the opposite side.
      const logCount = 4 + Math.floor(Math.random() * 2);   // 4–5 logs per area
      const stride   = (CFG.AREA_W - 400) / logCount;
      for (let i = 0; i < logCount; i++) {
        const lx = ax + 280 + i * stride + (Math.random() - 0.5) * 50;
        // Alternate edges, but skip the last slot before the door (last 250px of area)
        if (lx > ax + CFG.AREA_W - 280) continue;
        const onBack = (i % 2 === 0);
        const ly = onBack ? CFG.GROUND_TOP + 26 : CFG.GROUND_BOT - 16;
        const sprite = this.add.image(lx, ly, 'logpile')
          .setOrigin(0.5, 1).setDepth(0).setScale(0.95);
        // Depth-sort by groundY so logs in front draw over players behind them
        sprite.setDepth(8 + ly * 0.01);
        this.logPiles.push({ worldX: lx, groundY: ly, halfW: 30, halfH: 22, sprite });
      }

      // Enemies: 5-10 per area
      const count = 5 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        const ex = ax + 500 + Math.random() * (CFG.AREA_W - 650);
        const ey = CFG.GROUND_TOP + 30 + Math.random() * (CFG.GROUND_BOT - CFG.GROUND_TOP - 50);
        const isLast = (i === count - 1);
        this.enemies.push(new Enemy(this, ex, ey, a, isLast));
      }

      // Door between areas (not after boss area)
      if (a < 3) {
        const dx = (a + 1) * CFG.AREA_W - 60;
        this.doors.push(new Door(this, dx, CFG.GROUND_BOT, a));
      }
    }

    // === AREA 3: BOSS ARENA ===
    const bossAx = 3 * CFG.AREA_W;

    // Machine gun pickup – grab it before meeting the spider
    this.gunItems.push(new MachineGunItem(this, bossAx + 380, CFG.GROUND_BOT - 10));

    // Ominous "WARNING" sign text before boss
    this.add.text(bossAx + 750, CFG.GROUND_TOP - 20, '⚠ DANGER AHEAD ⚠', {
      fontSize: '10px', color: '#FF4444', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setDepth(20);

    // Boss spider
    const bossX = bossAx + 1100;
    const bossY = CFG.GROUND_TOP + (CFG.GROUND_BOT - CFG.GROUND_TOP) * 0.5;
    this.boss = new BossSpider(this, bossX, bossY);
  }

  update(time, delta) {
    if (this.gameOverDone || this.victoryDone) return;
    const dt = delta / 1000;

    this.player.update(dt, this.cursors, this.zKey, this.xKey, this.sKey);

    // Update boomerangs
    for (let i = this.boomerangs.length - 1; i >= 0; i--) {
      const b = this.boomerangs[i];
      b.update(dt);
      if (b.expired) {
        b.destroy();
        this.boomerangs.splice(i, 1);
      }
    }

    for (const e of this.enemies) {
      if (!e.dead) e.update(dt, this.player);
    }

    if (this.boss && !this.boss.dead) this.boss.update(dt, this.player);

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(dt);
      if (proj.expired) {
        proj.destroy();
        this.projectiles.splice(i, 1);
      }
    }

    this._checkPlayerEnemyCollision();
    this._checkProjectileCollisions();
    this._checkBoomerangCollisions();
    this._checkGunPickup();
    this._checkKeyPickup();
    this._checkDoorOpen();
    this._checkVictory();
    this._sortDepth();

    this.hud.update(this.player, this.score, this.keysHeld, this.currentArea);
  }

  _checkPlayerEnemyCollision() {
    if (this.player.state === 'dead') return;
    const p = this.player;

    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = Math.abs(p.worldX - e.worldX);
      const dy = Math.abs(p.groundY - e.groundY);
      const eAirborne = (e.state === 'jump-dodge' || e.state === 'jump-attack');

      // Enemy attack damages player
      if (e.state === 'attack' && e.attackHitActive && dx < 58 && dy < 45) {
        if (p.invincible <= 0) p.takeDamage(12);
      }

      // Player attack hits enemy (airborne dodgers slip past the swing)
      if (!eAirborne && p.state === 'attack' && p.attackHitActive) {
        const reach = 72;
        const hitX = p.worldX + p.facing * 36;
        const edx  = Math.abs(e.worldX - hitX);
        if (edx < reach && dy < 52) {
          if (!e.hitThisSwing) {
            e.hitThisSwing = true;
            if (e.state === 'block') {
              p.knockback(-p.facing * 160);
              this.cameras.main.shake(80, 0.006);
              this._floatText(e.worldX, e.groundY - 40, 'BLOCKED!', 0xAAAAAA);
            } else {
              e.takeDamage(28, p.facing);
              this.score += 100;
              p.combo++;
              p.comboTimer = 2.5;
              this.hud.showCombo(p.combo);
            }
          }
        }
      }
    }

    // Boss melee (weak — use the gun instead). Activated + close enough to actually reach.
    if (this.boss && !this.boss.dead && this.boss.activated &&
        p.state === 'attack' && p.attackHitActive) {
      const hitX = p.worldX + p.facing * 36;
      const bdx  = Math.abs(this.boss.worldX - hitX);
      const bdy  = Math.abs(p.groundY - this.boss.groundY);
      if (bdx < 90 && bdy < 80 && !p.hitBossThisSwing) {
        p.hitBossThisSwing = true;
        this.boss.takeDamage(5, 'melee');
        this._floatText(this.boss.worldX, this.boss.bodyCenterY() - 30, 'USE GUN!', 0xFFAA00);
      }
    }
  }

  _checkKeyPickup() {
    const p = this.player;
    for (const k of this.keyItems) {
      if (k.collected) continue;
      const dx = Math.abs(p.worldX - k.worldX);
      const dy = Math.abs(p.groundY - k.groundY);
      if (dx < 44 && dy < 44) {
        k.collect();
        this.keysHeld++;
        this.score += 500;
        this._floatText(k.worldX, k.groundY - 30, '🔑 KEY!', 0xFFD700);
      }
    }
  }

  _checkGunPickup() {
    const p = this.player;
    for (const g of this.gunItems) {
      if (g.collected) continue;
      const dx = Math.abs(p.worldX - g.worldX);
      const dy = Math.abs(p.groundY - g.groundY);
      if (dx < 50 && dy < 50) {
        g.collect();
        p.hasGun = true;
        this._floatText(g.worldX, g.groundY - 40, '🔫 MACHINE GUN!', 0xFFAA00);
        this.hud.showGunIcon();
      }
    }
  }

  // Returns the log pile that (wx, gy) overlaps, or null. Hitbox is the log's halfW × halfH.
  _logAt(wx, gy) {
    for (const lp of this.logPiles) {
      if (Math.abs(wx - lp.worldX) < lp.halfW && Math.abs(gy - lp.groundY) < lp.halfH) {
        return lp;
      }
    }
    return null;
  }

  // Given a previous and proposed position, returns the corrected (x, y) that doesn't
  // overlap a log pile. Allows axis sliding so diagonal movement glides along the obstacle.
  _resolveLogCollision(prevX, prevY, currX, currY) {
    if (!this._logAt(currX, currY)) return [currX, currY];
    if (!this._logAt(prevX, currY)) return [prevX, currY];   // X blocked — keep Y
    if (!this._logAt(currX, prevY)) return [currX, prevY];   // Y blocked — keep X
    return [prevX, prevY];                                   // fully wedged — stay put
  }

  _checkProjectileCollisions() {
    const p   = this.player;
    const cam = this.cameras.main;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (proj.expired) continue;

      if (proj.team === 'player') {
        // Bullet hits boss — gated by activation + on-screen visibility
        if (this.boss && !this.boss.dead && this.boss.activated) {
          const onScreen = this.boss.worldX > cam.scrollX - 40 &&
                           this.boss.worldX < cam.scrollX + cam.width + 40;
          if (onScreen) {
            const bcy = this.boss.bodyCenterY();
            const dx  = Math.abs(proj.worldX - this.boss.worldX);
            const dy  = Math.abs(proj.worldY - bcy);
            if (dx < 80 && dy < 100) {
              if (this.boss.state === 'block') {
                // Web shield deflects the sausage at a random backward angle
                const speed = Math.hypot(proj.vx, proj.vy) || CFG.BULLET_SPEED;
                const baseDir = proj.vx > 0 ? -1 : 1;  // bounce back
                const angle   = (Math.random() - 0.5) * 1.4;  // ±0.7 rad spread
                proj.vx = Math.cos(angle) * speed * baseDir;
                proj.vy = Math.sin(angle) * speed * 0.8;
                proj.team    = 'deflected';  // no more damage from this bullet
                proj.maxDist = 600;
                proj.travelled = 0;
                proj.sprite.setTint(0xFF6644).setScale(proj.sprite.scaleX * 1.2);
                this._spawnImpact(proj.worldX, proj.worldY, 0xCCCCFF);
                continue;
              }
              this.boss.takeDamage(CFG.BULLET_DAMAGE, 'bullet');
              this.score += 50;
              this._spawnImpact(proj.worldX, proj.worldY, 0xFFAA22);
              proj.expired = true;
              continue;
            }
          }
        }
        // Bullet hits regular enemy
        for (const e of this.enemies) {
          if (e.dead) continue;
          const dx = Math.abs(proj.worldX - e.worldX);
          // Enemy body center is roughly halfway up the sprite
          const ecy = e.groundY - CFG.SPRITE_SIZE * 0.55;
          const dy  = Math.abs(proj.worldY - ecy);
          if (dx < 40 && dy < 50) {
            e.takeDamage(CFG.BULLET_DAMAGE, proj.vx > 0 ? 1 : -1);
            this.score += 50;
            this._spawnImpact(proj.worldX, proj.worldY, 0xFFAA22);
            proj.expired = true;
            break;
          }
        }
      } else if (proj.team === 'enemy') {
        // Web hits player — must jump to avoid (factor jumpOffset into player Y)
        if (p.invincible <= 0 && p.state !== 'dead') {
          const dx = Math.abs(proj.worldX - p.worldX);
          // Player body center: chest area, accounting for jump
          const playerCenterY = p.groundY - CFG.SPRITE_SIZE * 0.5 - p.jumpOffset;
          const dy = Math.abs(proj.worldY - playerCenterY);
          if (dx < 30 && dy < 40) {
            p.takeDamage(20);
            this._spawnImpact(proj.worldX, proj.worldY, 0xCCCCFF);
            proj.expired = true;
          }
        }
      }
      // 'deflected' team passes through everyone harmlessly
    }
  }

  _checkBoomerangCollisions() {
    for (const b of this.boomerangs) {
      // Hits regular enemies
      for (const e of this.enemies) {
        if (e.dead || b.hits.has(e)) continue;
        const dx = Math.abs(b.x - e.worldX);
        const dy = Math.abs(b.y - (e.groundY - CFG.SPRITE_SIZE * 0.5));
        if (dx < 38 && dy < 50) {
          b.hits.add(e);
          e.takeDamage(22, b.vx > 0 ? 1 : -1);
          this.score += 80;
          this._spawnImpact(b.x, b.y, 0xFFAA22);
        }
      }
      // Hits boss (gated like bullets)
      if (this.boss && !this.boss.dead && this.boss.activated && !b.hits.has(this.boss)) {
        const cam = this.cameras.main;
        const onScreen = this.boss.worldX > cam.scrollX - 40 &&
                         this.boss.worldX < cam.scrollX + cam.width + 40;
        if (onScreen) {
          const dx = Math.abs(b.x - this.boss.worldX);
          const dy = Math.abs(b.y - this.boss.bodyCenterY());
          if (dx < 80 && dy < 100) {
            b.hits.add(this.boss);
            // Boomerang ignores web shield (it's a chunky physical sausage!) — but at half damage
            const dmg = (this.boss.state === 'block') ? Math.floor(CFG.BULLET_DAMAGE * 0.5) : CFG.BULLET_DAMAGE * 2;
            this.boss.takeDamage(dmg, 'boomerang');
            this.score += 100;
            this._spawnImpact(b.x, b.y, 0xFFAA22);
          }
        }
      }
    }
  }

  _spawnImpact(x, y, color) {
    // Core flash
    const flash = this.add.circle(x, y, 10, color)
      .setDepth(100).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: flash, scaleX: 4, scaleY: 4, alpha: 0,
      duration: 280, onComplete: () => flash.destroy(),
    });
    // Spark debris
    for (let i = 0; i < 8; i++) {
      const a  = Math.random() * Math.PI * 2;
      const r  = 26 + Math.random() * 14;
      const sp = this.add.rectangle(x, y, 3, 3, color).setDepth(100);
      this.tweens.add({
        targets: sp,
        x: x + Math.cos(a) * r, y: y + Math.sin(a) * r,
        alpha: 0, duration: 380,
        onComplete: () => sp.destroy(),
      });
    }
  }

  _checkDoorOpen() {
    const p = this.player;
    for (const d of this.doors) {
      if (d.open || d.area !== this.currentArea) continue;
      // Area must be cleared of enemies first
      const remaining = this.enemies.filter(e => e.area === this.currentArea && !e.dead).length;
      if (remaining > 0) continue;
      // Player close to door with key
      const dx = Math.abs(p.worldX - d.worldX);
      if (dx < 70 && this.keysHeld > this.currentArea) {
        d.openDoor(this);
        this.currentArea++;
      }
    }
  }

  _checkVictory() {
    if (!this.boss || !this.boss.dead) return;
    if (!this.victoryDone) {
      this.victoryDone = true;
      this.time.delayedCall(1500, () => this._showVictory());
    }
  }

  _sortDepth() {
    const all = [this.player, ...this.enemies.filter(e => !e.dead),
                 ...(this.boss && !this.boss.dead ? [this.boss] : [])];
    all.sort((a, b) => a.groundY - b.groundY);
    all.forEach((o, i) => {
      o.sprite.setDepth(10 + i * 2);
      if (o.shadow) o.shadow.setDepth(9 + i * 2);
    });
  }

  spawnKey(x, y, area) {
    const k = new KeyItem(this, x, y - 28, area);
    this.keyItems.push(k);
  }

  _floatText(x, y, text, color) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const t = this.add.text(x, y, text, {
      fontSize: '14px', color: hex, fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3
    }).setDepth(200).setOrigin(0.5);
    this.tweens.add({ targets: t, y: y - 55, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
  }

  _showVictory() {
    const W = CFG.W, H = CFG.H;
    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setScrollFactor(0).setDepth(300);
    this.tweens.add({
      targets: ov, alpha: 0.75, duration: 1000, onComplete: () => {
        this.add.text(W / 2, H / 2 - 50, 'VICTORY!', {
          fontSize: '42px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
          stroke: '#000', strokeThickness: 6
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 5, `Score: ${this.score}`, {
          fontSize: '20px', color: '#ffffff', fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 50, 'Press Z (or tap) to play again', {
          fontSize: '11px', color: '#aaffaa', fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5);
        this.time.delayedCall(800, () => this._armRestart());
      }
    });
  }

  // Restart on Z key, screen tap, or mobile virtual tap.
  _armRestart() {
    let restarted = false;
    const restart = () => { if (restarted) return; restarted = true; this.scene.restart(); };
    this.input.keyboard.once('keydown-Z', restart);
    this.input.once('pointerdown', restart);
    const watcher = this.time.addEvent({
      delay: 80, loop: true, callback: () => {
        if (window.__VKEYS__ && window.__VKEYS__.tap) {
          window.__VKEYS__.tap = false;
          restart();
        }
      }
    });
    this.events.once('shutdown', () => watcher.remove(false));
  }

  showGameOver() {
    if (this.gameOverDone) return;
    this.gameOverDone = true;
    const W = CFG.W, H = CFG.H;
    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setScrollFactor(0).setDepth(300);
    this.tweens.add({
      targets: ov, alpha: 0.85, duration: 1500, onComplete: () => {
        this.add.text(W / 2, H / 2 - 40, 'GAME OVER', {
          fontSize: '40px', color: '#FF2222', fontFamily: 'monospace', fontStyle: 'bold',
          stroke: '#000', strokeThickness: 6
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 18, `Score: ${this.score}`, {
          fontSize: '18px', color: '#ffaaaa', fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 52, 'Press Z (or tap) to try again', {
          fontSize: '11px', color: '#ff8888', fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5);
        this.time.delayedCall(1000, () => this._armRestart());
      }
    });
  }
}

// =============================================================================
// PLAYER  (Maks)
// =============================================================================
class Player {
  constructor(scene, x, y) {
    this.scene   = scene;
    this.worldX  = x;
    this.groundY = y;

    // Jump state (visual offset, not physics body)
    this.jumpVel    = 0;
    this.jumpOffset = 0;  // positive = in air
    this.isJumping  = false;

    this.facing  = 1;   // 1=right, -1=left
    this.state   = 'idle';
    this.hp      = 100;
    this.maxHp   = 100;

    // Timers (seconds)
    this.attackTimer   = 0;
    this.attackCooldown= 0;
    this.hurtTimer     = 0;
    this.invincible    = 0;
    this.knockVelX     = 0;

    this.attackHitActive = false;
    this.combo     = 0;
    this.comboTimer= 0;

    this.hasGun            = false;
    this.gunCooldown       = 0;
    this.hitBossThisSwing  = false;
    this.boomerangCooldown = 0;
    this.boomerangActive   = false;
    this.throwTimer        = 0;  // > 0 while throw animation is playing

    const s = CFG.SPRITE_SIZE;  // 68 – center sprite s px above ground so feet land at groundY
    this.shadow = scene.add.ellipse(x, y + 6, 30, 10, 0x000000, 0.45).setDepth(5);
    this.sprite = scene.add.sprite(x, y - s, 'maks-idle').play('maks-idle').setScale(2).setDepth(10);

    // Machine gun overlay (hidden until pickup) — positioned at hand height, follows the player
    this.gunSprite = scene.add.image(x, y - 60, 'machinegun')
      .setOrigin(0.3, 0.5).setScale(1.4).setDepth(11).setVisible(false);
  }

  update(dt, cursors, zKey, xKey, sKey) {
    // Decrement timers
    if (this.attackCooldown   > 0) this.attackCooldown   -= dt;
    if (this.invincible       > 0) this.invincible       -= dt;
    if (this.gunCooldown      > 0) this.gunCooldown      -= dt;
    if (this.boomerangCooldown> 0) this.boomerangCooldown -= dt;
    if (this.throwTimer       > 0) this.throwTimer       -= dt;
    if (this.comboTimer       > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0; }

    // Knockback drift
    if (Math.abs(this.knockVelX) > 2) {
      this.worldX   += this.knockVelX * dt;
      this.knockVelX *= Math.pow(0.01, dt);  // exponential decay
    } else {
      this.knockVelX = 0;
    }

    if (this.state === 'dead') { this._syncSprite(); return; }

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      this._setAnim('maks-hurt');
      this._syncSprite();
      return;
    }

    if (this.state === 'attack') {
      this.attackTimer -= dt;
      this.attackHitActive = (this.attackTimer > 0.15 && this.attackTimer < 0.38);
      if (this.attackTimer <= 0) {
        this.state = 'idle';
        for (const e of this.scene.enemies) e.hitThisSwing = false;
        this.hitBossThisSwing = false;
      }
      this._syncSprite();
      return;
    }

    // ── INPUT (keyboard + touch via window.__VKEYS__) ──────────────────────
    const vk = (typeof window !== 'undefined' && window.__VKEYS__) || {};
    let mvX = 0, mvY = 0;
    if (cursors.left.isDown  || vk.left)  { mvX = -CFG.PLAYER_SPEED; this.facing = -1; }
    if (cursors.right.isDown || vk.right) { mvX =  CFG.PLAYER_SPEED; this.facing =  1; }
    if (cursors.up.isDown    || vk.up)    mvY = -CFG.PLAYER_SPEED * 0.55;
    if (cursors.down.isDown  || vk.down)  mvY =  CFG.PLAYER_SPEED * 0.55;

    // Touch edges are consumed (one-shot) once read
    const zEdge = Phaser.Input.Keyboard.JustDown(zKey) || vk.zEdge;
    const xEdge = Phaser.Input.Keyboard.JustDown(xKey) ||
                  Phaser.Input.Keyboard.JustDown(cursors.space) || vk.xEdge;
    const sEdge = (sKey && Phaser.Input.Keyboard.JustDown(sKey)) || vk.sEdge;
    if (vk.zEdge) vk.zEdge = false;
    if (vk.xEdge) vk.xEdge = false;
    if (vk.sEdge) vk.sEdge = false;

    // Attack (Z) — gun mode fires sausage bullets, melee otherwise
    if (this.hasGun) {
      if ((zKey.isDown || vk.z) && this.gunCooldown <= 0) {
        this.gunCooldown = CFG.BULLET_RATE;
        this._fireBullet();
      }
    } else if (zEdge && this.attackCooldown <= 0) {
      this.state        = 'attack';
      this.attackTimer  = 0.50;
      this.attackCooldown = 0.60;
      this.attackHitActive= false;
      this._setAnim('maks-attack');
      this._syncSprite();
      return;
    }

    // Throw boomerang (S) — only available before grabbing the machine gun
    if (sEdge && !this.hasGun && this.boomerangCooldown <= 0 && !this.boomerangActive) {
      this.boomerangCooldown = 1.0;
      this.boomerangActive   = true;
      this.throwTimer        = 0.45;
      this._setAnim('maks-throw');
      const launchFacing = this.facing;
      this.scene.time.delayedCall(180, () => {
        if (this.state === 'dead' || !this.scene) return;
        this.scene.boomerangs.push(new Boomerang(this.scene, this, launchFacing));
      });
    }

    // Jump (X or Space)
    if (xEdge && !this.isJumping) {
      this.jumpVel   = CFG.JUMP_VEL;
      this.isJumping = true;
      this._setAnim('maks-jump');
    }

    // Apply movement
    const prevX = this.worldX, prevY = this.groundY;
    this.worldX  += mvX * dt;
    this.groundY += mvY * dt;
    this.worldX   = Math.max(30, this.worldX);
    this.groundY  = Phaser.Math.Clamp(this.groundY, CFG.GROUND_TOP + 12, CFG.GROUND_BOT);

    // Log pile obstacle resolution (jumping over them is allowed — skip if airborne)
    if (!this.isJumping && this.scene.logPiles) {
      const [nx, ny] = this.scene._resolveLogCollision(prevX, prevY, this.worldX, this.groundY);
      this.worldX = nx; this.groundY = ny;
    }

    // Jump physics
    if (this.isJumping) {
      this.jumpVel    += CFG.GRAVITY * dt;
      this.jumpOffset -= this.jumpVel * dt;
      if (this.jumpOffset <= 0) {
        this.jumpOffset = 0;
        this.jumpVel    = 0;
        this.isJumping  = false;
      }
    }

    // Anim state
    if (!this.isJumping) {
      if (this.throwTimer > 0) {
        // Keep maks-throw playing while the windup runs
      } else if (mvX !== 0 || mvY !== 0) {
        this._setAnim('maks-walk'); this.state = 'walk';
      } else {
        this._setAnim('maks-idle'); this.state = 'idle';
      }
    } else {
      this.state = 'jump';
    }

    this._syncSprite();
  }

  _setAnim(key) {
    // Substitute armed Maks animations when he's holding the machine gun, so the
    // sprite itself shows him gripping the gun (no floating overlay needed).
    if (this.hasGun) {
      const armed = key + '-armed';  // e.g. 'maks-walk' → 'maks-walk-armed' (not used)
      // Specific overrides only — idle / walk get the gun-holding poses.
      if (key === 'maks-idle' && this.scene.anims.exists('maks-armed-idle')) key = 'maks-armed-idle';
      else if (key === 'maks-walk' && this.scene.anims.exists('maks-armed-walk')) key = 'maks-armed-walk';
      else if (key === 'maks-run'  && this.scene.anims.exists('maks-armed-walk')) key = 'maks-armed-walk';
    }
    if (this.sprite.anims.currentAnim?.key !== key) this.sprite.play(key, true);
  }

  _syncSprite() {
    const s = CFG.SPRITE_SIZE;
    this.sprite.setPosition(this.worldX, this.groundY - s - this.jumpOffset);
    this.sprite.setFlipX(this.facing < 0);
    this.shadow.setPosition(this.worldX, this.groundY + 6);
    const shadowScale = Math.max(0.3, 1 - this.jumpOffset * 0.0018);
    this.shadow.setScale(shadowScale, shadowScale * 0.4);
    this.shadow.setAlpha(0.45 * shadowScale);

    // Floating gun overlay: only used as a fallback while the armed-Maks sprite
    // hasn't been generated yet. Once it lands, hide the overlay since Maks
    // already holds the gun in his actual sprite.
    const armedSpriteReady = this.scene.anims.exists('maks-armed-idle');
    if (this.hasGun && !armedSpriteReady) {
      const gx = this.worldX + this.facing * 8;
      const gy = this.groundY - 70 - this.jumpOffset;
      this.gunSprite.setVisible(true).setPosition(gx, gy).setFlipX(this.facing < 0).setDepth(11);
    } else if (this.gunSprite.visible) {
      this.gunSprite.setVisible(false);
    }
  }

  // Returns the gun barrel tip in world coords (for bullet spawn).
  _gunBarrelXY() {
    const bx = this.worldX + this.facing * 44;
    const by = this.groundY - 70 - this.jumpOffset;
    return [bx, by];
  }

  takeDamage(amount) {
    if (this.invincible > 0 || this.state === 'dead') return;
    this.hp -= amount;
    this.hurtTimer  = 0.38;
    this.invincible = 1.1;
    this.combo      = 0;
    this.comboTimer = 0;

    // Blink red
    this.scene.tweens.add({ targets: this.sprite, alpha: 0.1, duration: 60, yoyo: true, repeat: 4,
      onComplete: () => this.sprite.setAlpha(1) });

    if (this.hp <= 0) {
      this.hp    = 0;
      this.state = 'dead';
      this._setAnim('maks-death');
      this.sprite.once('animationcomplete', () =>
        this.scene.time.delayedCall(700, () => this.scene.showGameOver()));
    }
  }

  knockback(velX) {
    this.knockVelX = velX;
    this.hurtTimer  = 0.28;
    this.invincible = 0.6;
  }

  _fireBullet() {
    const [bx, by] = this._gunBarrelXY();
    const proj = new Projectile(this.scene, bx, by, CFG.BULLET_SPEED * this.facing, 0, 'player', 'sausage-bullet');
    this.scene.projectiles.push(proj);
    // Muzzle flash
    const flash = this.scene.add.circle(bx, by, 6, 0xFFEE88).setBlendMode(Phaser.BlendModes.ADD).setDepth(50);
    this.scene.tweens.add({
      targets: flash, scale: 2.4, alpha: 0, duration: 90,
      onComplete: () => flash.destroy(),
    });
  }
}

// =============================================================================
// ENEMY  (German Soldier)
// =============================================================================
const ES = {
  IDLE:'idle', PATROL:'patrol', CHASE:'chase', BLOCK:'block', ATTACK:'attack',
  HURT:'hurt', DEAD:'dead', JUMP_DODGE:'jump-dodge', JUMP_ATTACK:'jump-attack',
};

class Enemy {
  constructor(scene, x, y, area, isKeyHolder) {
    this.scene      = scene;
    this.worldX     = x;
    this.groundY    = y;
    this.area       = area;
    this.isKeyHolder= isKeyHolder;
    this.dead       = false;

    this.hp    = 60;
    this.maxHp = 60;
    this.state = ES.IDLE;
    this.facing= -1;

    this.stateTimer    = 1.5 + Math.random() * 2;
    this.blockTimer    = 0;
    this.attackTimer   = 0;
    this.hurtTimer     = 0;
    this.attackHitActive = false;
    this.hitThisSwing  = false;
    this.jumpVel       = 0;
    this.jumpOffset    = 0;
    this.jumpTargetX   = 0;
    this.dodgeCooldown = 0;

    this.patrolDir    = Math.random() > 0.5 ? 1 : -1;
    this.patrolOriginX = x;
    this.activated    = false;

    const s = CFG.SPRITE_SIZE;  // 68
    this.shadow   = scene.add.ellipse(x, y + 6, 30, 10, 0x000000, 0.35).setDepth(5);
    this.sprite   = scene.add.sprite(x, y - s, 'enemy-idle').play('enemy-idle').setScale(2).setDepth(10);

    // Shield icon (visible while blocking)
    this.shieldIcon = scene.add.text(x, y - 56, '🛡', { fontSize: '18px' })
      .setDepth(60).setVisible(false).setOrigin(0.5);

    // HP bar
    this.hpBg  = scene.add.rectangle(x, y - 50, 38, 5, 0x440000).setDepth(60);
    this.hpFill= scene.add.rectangle(x - 19, y - 50, 38, 5, 0xFF2222).setDepth(61).setOrigin(0, 0.5);
  }

  update(dt, player) {
    if (this.dead) return;

    const dx   = player.worldX - this.worldX;
    const dy   = player.groundY - this.groundY;
    const dist = Math.hypot(dx, dy);

    if (!this.activated && dist < 650) this.activated = true;
    if (!this.activated) return;

    this.stateTimer    -= dt;
    if (this.hurtTimer    > 0) this.hurtTimer    -= dt;
    if (this.dodgeCooldown> 0) this.dodgeCooldown -= dt;

    // Update HP display
    const ratio = this.hp / this.maxHp;
    this.hpFill.setScale(ratio, 1);
    this.hpFill.setFillStyle(ratio > 0.5 ? 0xFF2222 : ratio > 0.25 ? 0xFF8800 : 0xFF0000);

    // ── REACTIVE DODGE: leap backward when player swings nearby ────────────
    const playerSwinging = player.state === 'attack' && player.attackHitActive;
    const inJump = (this.state === ES.JUMP_DODGE || this.state === ES.JUMP_ATTACK);
    if (playerSwinging && dist < 110 && this.dodgeCooldown <= 0 &&
        this.state !== ES.HURT && this.state !== ES.DEAD && !inJump) {
      this._beginJumpDodge(player);
    }

    switch (this.state) {
      case ES.IDLE:
        this._setAnim('enemy-idle');
        if (dist < 420 || this.stateTimer <= 0) {
          this.state = dist < 420 ? ES.CHASE : ES.PATROL;
          this.stateTimer = 0.8 + Math.random() * 0.8;
        }
        break;

      case ES.PATROL: {
        const spd = CFG.ENEMY_SPEED * 0.75;
        const prevX = this.worldX;
        this.worldX += this.patrolDir * spd * dt;
        if (this.scene._logAt && this.scene._logAt(this.worldX, this.groundY)) {
          this.worldX = prevX;
          this.patrolDir *= -1;
        }
        if (Math.abs(this.worldX - this.patrolOriginX) > 160) this.patrolDir *= -1;
        this.facing = this.patrolDir;
        this._setAnim('enemy-walk');
        if (dist < 280 || this.stateTimer <= 0) { this.state = ES.CHASE; this.stateTimer = 3; }
        break;
      }

      case ES.CHASE: {
        // Pounce attack — close the distance with a leap when at medium range
        if (dist > 90 && dist < 240 && this.dodgeCooldown <= 0 && Math.random() < 0.022) {
          this._beginJumpAttack(player);
          break;
        }
        if (dist > 52) {
          const prevX = this.worldX, prevY = this.groundY;
          const nx = dx / dist, ny = dy / dist;
          this.worldX  += nx * CFG.ENEMY_SPEED * dt;
          this.groundY += ny * CFG.ENEMY_SPEED * 0.55 * dt;
          if (this.scene.logPiles) {
            const [rx, ry] = this.scene._resolveLogCollision(prevX, prevY, this.worldX, this.groundY);
            this.worldX = rx; this.groundY = ry;
          }
          this.facing   = Math.sign(dx) || 1;
          this._setAnim('enemy-walk');
        } else {
          // Close enough → quick block then attack
          this.state      = ES.BLOCK;
          this.blockTimer = 0.35 + Math.random() * 0.25;
          this.shieldIcon.setVisible(true);
          this._setAnim('enemy-block');
        }
        break;
      }

      case ES.BLOCK: {
        this.blockTimer -= dt;
        this.shieldIcon.setAlpha(0.5 + 0.5 * Math.sin(Date.now() * 0.012));
        this.facing = Math.sign(player.worldX - this.worldX) || 1;
        if (this.blockTimer <= 0) {
          this.shieldIcon.setVisible(false);
          this.state        = ES.ATTACK;
          this.attackTimer  = 0.46;
          this.attackHitActive = false;
          this._setAnim('enemy-attack');
        }
        break;
      }

      case ES.ATTACK: {
        this.attackTimer -= dt;
        this.attackHitActive = (this.attackTimer < 0.30 && this.attackTimer > 0.08);
        if (this.attackTimer <= 0) {
          this.attackHitActive = false;
          this.state      = ES.IDLE;
          this.stateTimer = 0.25 + Math.random() * 0.35;
        }
        break;
      }

      case ES.HURT: {
        this._setAnim('enemy-hurt');
        if (this.hurtTimer <= 0) { this.state = ES.CHASE; this.stateTimer = 0.3; }
        break;
      }

      case ES.JUMP_DODGE:
      case ES.JUMP_ATTACK: {
        // Apply gravity-driven jump physics + lerp horizontal toward jumpTargetX
        this.jumpVel    += CFG.GRAVITY * dt;
        this.jumpOffset -= this.jumpVel * dt;
        const lerp = (this.state === ES.JUMP_ATTACK) ? 6 : 5;
        this.worldX += (this.jumpTargetX - this.worldX) * lerp * dt;
        this._setAnim('enemy-jump');
        if (this.jumpOffset <= 0) {
          this.jumpOffset = 0;
          this.jumpVel    = 0;
          if (this.state === ES.JUMP_ATTACK) {
            // Land + immediately swing
            this.state           = ES.ATTACK;
            this.attackTimer     = 0.42;
            this.attackHitActive = false;
            this._setAnim('enemy-attack');
            this.facing = Math.sign(player.worldX - this.worldX) || 1;
          } else {
            this.state      = ES.CHASE;
            this.stateTimer = 0.5;
          }
        }
        break;
      }
    }

    // Clamp to corridor
    this.groundY = Phaser.Math.Clamp(this.groundY, CFG.GROUND_TOP + 12, CFG.GROUND_BOT);

    this._syncSprite();
  }

  _setAnim(key) {
    if (this.sprite.anims.currentAnim?.key !== key) this.sprite.play(key, true);
  }

  _beginJumpDodge(player) {
    // Leap backward, away from the player, with a slight upward-back arc.
    const back = (player.worldX > this.worldX) ? -1 : 1;
    this.state         = ES.JUMP_DODGE;
    this.jumpVel       = CFG.JUMP_VEL * 0.85;     // initial up-velocity
    this.jumpOffset    = 1;                       // get airborne
    this.jumpTargetX   = this.worldX + back * 110; // land ~110px behind
    this.dodgeCooldown = 1.6;
    this.facing        = -back;                   // still face the player
    this._setAnim('enemy-jump');
  }

  _beginJumpAttack(player) {
    // Pounce — leap forward, toward the player. Lands and immediately attacks.
    this.state         = ES.JUMP_ATTACK;
    this.jumpVel       = CFG.JUMP_VEL * 0.95;
    this.jumpOffset    = 1;
    this.jumpTargetX   = player.worldX + (this.worldX < player.worldX ? -28 : 28);
    this.dodgeCooldown = 1.2;
    this.facing        = Math.sign(player.worldX - this.worldX) || 1;
    this._setAnim('enemy-jump');
  }

  _syncSprite() {
    const s = CFG.SPRITE_SIZE;
    const yOff = this.jumpOffset || 0;
    this.sprite.setPosition(this.worldX, this.groundY - s - yOff);
    this.sprite.setFlipX(this.facing < 0);
    this.shadow.setPosition(this.worldX, this.groundY + 6);
    // Shadow shrinks when airborne
    if (yOff > 0) {
      const sc = Math.max(0.4, 1 - yOff * 0.005);
      this.shadow.setScale(sc, sc * 0.6).setAlpha(0.35 * sc);
    } else {
      this.shadow.setScale(1, 1).setAlpha(0.35);
    }
    this.shieldIcon.setPosition(this.worldX, this.groundY - 58 - yOff);
    this.hpBg.setPosition(this.worldX, this.groundY - 50 - yOff);
    this.hpFill.setPosition(this.worldX - 19, this.groundY - 50 - yOff);
  }

  takeDamage(amount, fromDir) {
    if (this.state === ES.DEAD) return;
    this.hp -= amount;
    this.worldX += fromDir * 28;

    // Hit flash
    this.scene.tweens.add({ targets: this.sprite, alpha: 0.2, duration: 60, yoyo: true, repeat: 1,
      onComplete: () => this.sprite.setAlpha(1) });

    if (this.hp <= 0) {
      this.hp    = 0;
      this.state = ES.DEAD;
      this.dead  = true;
      this.shieldIcon.setVisible(false);
      this._setAnim('enemy-death');

      this.scene.time.delayedCall(500, () => {
        if (this.isKeyHolder) this.scene.spawnKey(this.worldX, this.groundY, this.area);
        this.scene.tweens.add({
          targets: [this.sprite, this.shadow, this.hpBg, this.hpFill],
          alpha: 0, duration: 600,
          onComplete: () => {
            [this.sprite, this.shadow, this.hpBg, this.hpFill, this.shieldIcon].forEach(o => o.destroy());
          }
        });
      });
    } else {
      this.state     = ES.HURT;
      this.hurtTimer = 0.32;
    }
  }
}

// =============================================================================
// PROJECTILE  (sausage bullets + spider webs)
// =============================================================================
class Projectile {
  constructor(scene, x, y, vx, vy, team, texture) {
    this.scene   = scene;
    this.worldX  = x;
    this.worldY  = y;
    this.vx      = vx;
    this.vy      = vy;
    this.team    = team;  // 'player' or 'enemy'
    this.expired = false;
    this.travelled = 0;
    this.maxDist   = team === 'player' ? 920 : 720;

    const scl = team === 'player' ? 1.2 : 1.5;
    this.sprite = scene.add.image(x, y, texture)
      .setDepth(50).setScale(scl)
      .setFlipX(vx < 0);
  }

  update(dt) {
    this.worldX    += this.vx * dt;
    this.worldY    += this.vy * dt;
    this.travelled += Math.abs(this.vx * dt) + Math.abs(this.vy * dt);
    if (this.travelled > this.maxDist) this.expired = true;
    if (!this.expired) this.sprite.setPosition(this.worldX, this.worldY);
  }

  destroy() {
    this.sprite.destroy();
  }
}

// =============================================================================
// MACHINE GUN ITEM
// =============================================================================
// =============================================================================
// SAUSAGE BOOMERANG  —  flies out 2/3 of the screen and returns to Maks's hand
// =============================================================================
class Boomerang {
  constructor(scene, player, facing) {
    this.scene  = scene;
    this.player = player;
    this.facing = facing;
    this.startX = player.worldX;
    this.x      = player.worldX + facing * 30;
    this.y      = player.groundY - 60 - player.jumpOffset;
    this.maxDist = CFG.W * 0.66;   // ~2/3 of screen width
    this.speed  = 420;
    this.phase  = 'outgoing';
    this.expired= false;
    this.angle  = 0;
    this.hits   = new Set();
    this.vx     = facing * this.speed;  // current horizontal velocity (used for hit knockback dir)
    this.vy     = 0;

    this.sprite = scene.add.image(this.x, this.y, 'sausage-boomerang')
      .setDepth(50).setScale(1.2);
    // Spin glow trail — small additive ellipse behind it
    this.trail = scene.add.ellipse(this.x, this.y, 22, 14, 0xFFCC44, 0.55)
      .setDepth(49).setBlendMode(Phaser.BlendModes.ADD);
  }

  update(dt) {
    // Fast spin
    this.angle = (this.angle + 720 * dt) % 360;
    this.sprite.setAngle(this.angle);

    if (this.phase === 'outgoing') {
      this.x += this.facing * this.speed * dt;
      this.vx = this.facing * this.speed;
      this.vy = 0;
      if (Math.abs(this.x - this.startX) >= this.maxDist) {
        this.phase = 'returning';
        this.hits.clear();    // can re-hit on the way back
      }
    } else {
      // Home in on Maks's current hand position
      const tx = this.player.worldX + this.facing * -8;
      const ty = this.player.groundY - 60 - this.player.jumpOffset;
      const dx = tx - this.x, dy = ty - this.y;
      const d  = Math.hypot(dx, dy) || 1;
      this.vx = (dx / d) * this.speed;
      this.vy = (dy / d) * this.speed;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (d < 36) {
        this.expired = true;
        this.player.boomerangActive = false;
      }
    }

    this.sprite.setPosition(this.x, this.y);
    this.trail.setPosition(this.x, this.y);
    this.trail.setAlpha(0.45 + 0.25 * Math.sin(Date.now() * 0.04));
  }

  destroy() {
    this.sprite.destroy();
    this.trail.destroy();
  }
}

class MachineGunItem {
  constructor(scene, x, y) {
    this.scene     = scene;
    this.worldX    = x;
    this.groundY   = y;
    this.collected = false;

    this.sprite = scene.add.image(x, y, 'machinegun').setDepth(8).setScale(2.5);
    scene.tweens.add({ targets: this.sprite, y: y - 10, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: this.sprite, angle: 5, duration: 400, yoyo: true, repeat: -1 });

    // Glow label
    this.label = scene.add.text(x, y - 28, '🔫 PICK UP', {
      fontSize: '8px', color: '#FFAA00', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2,
    }).setDepth(9).setOrigin(0.5);
    scene.tweens.add({ targets: this.label, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });
  }

  collect() {
    if (this.collected) return;
    this.collected = true;
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.killTweensOf(this.label);
    this.scene.tweens.add({
      targets: [this.sprite, this.label],
      y: this.groundY - 60, alpha: 0, scaleX: 3, scaleY: 3,
      duration: 400, onComplete: () => { this.sprite.destroy(); this.label.destroy(); }
    });
  }
}

// =============================================================================
// BOSS SPIDER
// =============================================================================
const BS = { IDLE:'idle', WALK:'walk', SHOOT:'shoot', BLOCK:'block', HURT:'hurt', DEAD:'dead' };
const BOSS_SCALE = 2.5;
// Half rendered height — used to anchor sprite center so feet sit at groundY.
const BOSS_HALF_H = CFG.BOSS_SIZE * BOSS_SCALE / 2;

class BossSpider {
  constructor(scene, x, y) {
    this.scene    = scene;
    this.worldX   = x;
    this.groundY  = y;
    this.dead     = false;

    this.hp       = CFG.BOSS_HP;
    this.maxHp    = CFG.BOSS_HP;
    this.state    = BS.IDLE;
    this.facing   = -1;
    this.activated= false;

    this.stateTimer  = 0;
    this.shootTimer  = 0;
    this.hurtTimer   = 0;
    this.blockTimer  = 0;
    this.websShot    = 0;
    this.maxWebs     = 3;

    this.shadow = scene.add.ellipse(x, y + 8, 90, 22, 0x000000, 0.55).setDepth(5);
    this.sprite = scene.add.sprite(x, y - BOSS_HALF_H, 'spider-idle')
      .play('spider-idle').setScale(BOSS_SCALE).setDepth(10);

    // Boss HP bar (fixed to screen bottom)
    const bw = 320, bh = 14;
    const bx = CFG.W / 2, by = CFG.H - 22;
    this.hpBarBg   = scene.add.rectangle(bx, by, bw + 4, bh + 4, 0x000000, 0.8)
      .setScrollFactor(0).setDepth(160);
    this.hpBarTrack= scene.add.rectangle(bx, by, bw, bh, 0x440000)
      .setScrollFactor(0).setDepth(161);
    this.hpBarFill = scene.add.rectangle(bx - bw / 2, by, bw, bh, 0xFF2222)
      .setScrollFactor(0).setDepth(162).setOrigin(0, 0.5);
    this.hpBarLabel= scene.add.text(bx, by - 12, '🕷 ARACHNO BOSS', {
      fontSize: '9px', color: '#FF8888', fontFamily: 'monospace', fontStyle: 'bold', stroke: '#000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(162).setOrigin(0.5, 1);
    // Hide until activated
    [this.hpBarBg, this.hpBarTrack, this.hpBarFill, this.hpBarLabel].forEach(o => o.setAlpha(0));
  }

  update(dt, player) {
    if (this.dead) return;

    const dx   = player.worldX - this.worldX;
    const dy   = player.groundY - this.groundY;
    const dist = Math.hypot(dx, dy);

    if (!this.activated && dist < 700) {
      this.activated  = true;
      this.state      = BS.WALK;
      this.stateTimer = 1.2;  // initial chase phase before first volley
      // Reveal health bar
      this.scene.tweens.add({
        targets: [this.hpBarBg, this.hpBarTrack, this.hpBarFill, this.hpBarLabel],
        alpha: 1, duration: 600,
      });
      // Boss arrival shake
      this.scene.cameras.main.shake(400, 0.012);
      this.scene._floatText(this.worldX, this.groundY - 100, '⚠ SPIDER BOSS!', 0xFF2200);
    }
    if (!this.activated) return;

    // Update boss HP bar
    const ratio = this.hp / this.maxHp;
    this.hpBarFill.setScale(ratio, 1);
    this.hpBarFill.setFillStyle(ratio > 0.5 ? 0xFF2222 : ratio > 0.25 ? 0xFF6600 : 0xFF0000);

    const enraged = this.hp < this.maxHp * 0.5;
    const spd = enraged ? CFG.BOSS_SPEED * 1.45 : CFG.BOSS_SPEED;
    this.maxWebs = enraged ? 6 : 4;

    if (this.hurtTimer > 0) { this.hurtTimer -= dt; this._syncSprite(); return; }

    switch (this.state) {
      case BS.WALK: {
        // Always pursue the player AND weave up/down the corridor so the player
        // can't camp at one Y. After a chase interval, fire a volley.
        this.stateTimer -= dt;
        if (dist > 80) {
          const nx = dx / dist, ny = dy / dist;
          this.worldX  += nx * spd * dt;
          // Pursue depth strongly + sinusoidal weave
          this.weavePhase = (this.weavePhase || 0) + dt * 3.5;
          const weave = Math.sin(this.weavePhase) * 70;  // ±70 px/s vertical wobble
          this.groundY += (ny * spd * 0.85 + weave) * dt;
        }
        this.facing = Math.sign(dx) || -1;
        this._setAnim('spider-walk');
        // Volley trigger — chase briefly then fire
        if (this.stateTimer <= 0) {
          this.state      = BS.SHOOT;
          this.websShot   = 0;
          this.stateTimer = enraged ? 0.12 : 0.20;  // brief windup
          this._setAnim('spider-attack');
        }
        break;
      }

      case BS.SHOOT: {
        this.stateTimer -= dt;
        this.facing = Math.sign(dx) || -1;
        if (this.stateTimer <= 0 && this.websShot < this.maxWebs) {
          this._fireWeb(player);
          this.websShot++;
          this.stateTimer = enraged ? 0.22 : 0.32;  // tight rhythm — must keep jumping
        }
        if (this.websShot >= this.maxWebs && this.stateTimer <= 0) {
          // After volley, occasionally web-shield (less often than before)
          if (Math.random() < (enraged ? 0.4 : 0.22)) {
            this.state      = BS.BLOCK;
            this.blockTimer = enraged ? 1.0 : 0.85;
            this._setAnim('spider-attack');
            this.scene._floatText(this.worldX, this.bodyCenterY() - 30, '🕸 WEB SHIELD!', 0xCCCCFF);
          } else {
            this.state      = BS.WALK;
            this.stateTimer = enraged ? 0.7 : 1.1;  // chase between volleys
            this._setAnim('spider-walk');
          }
        }
        break;
      }

      case BS.BLOCK: {
        this.blockTimer -= dt;
        this.facing = Math.sign(dx) || -1;
        // Pulsing icy-white tint while shielding
        const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.018);
        const blue  = Math.floor(255 * pulse);
        this.sprite.setTint((220 << 16) | (220 << 8) | blue);
        if (this.blockTimer <= 0) {
          this.sprite.clearTint();
          this.state = BS.WALK;
          this._setAnim('spider-walk');
        }
        break;
      }
    }

    this.groundY = Phaser.Math.Clamp(this.groundY, CFG.GROUND_TOP + 12, CFG.GROUND_BOT);
    this._syncSprite();
  }

  // Vertical center of the visible spider body — used for hit detection + web spawn.
  bodyCenterY() {
    return this.groundY - BOSS_HALF_H;
  }

  _fireWeb(player) {
    // Spawn from spider's mouth/body and aim toward player's chest level.
    const startX  = this.worldX + this.facing * 60;
    const startY  = this.bodyCenterY() + 10;  // just below body center, near abdomen
    const targetX = player.worldX;
    const targetY = player.groundY - 38;       // player's chest height (must jump to dodge)
    const ddx = targetX - startX, ddy = targetY - startY;
    const dd  = Math.hypot(ddx, ddy) || 1;
    const vx  = (ddx / dd) * CFG.WEB_SPEED;
    const vy  = (ddy / dd) * CFG.WEB_SPEED;
    const proj = new Projectile(this.scene, startX, startY, vx, vy, 'enemy', 'web-blob');
    this.scene.projectiles.push(proj);
    this.scene.cameras.main.shake(60, 0.004);
  }

  _setAnim(key) {
    if (this.sprite.anims.currentAnim?.key !== key) this.sprite.play(key, true);
  }

  _syncSprite() {
    // Sprite center positioned so that bottom (feet) lands at groundY.
    this.sprite.setPosition(this.worldX, this.groundY - BOSS_HALF_H);
    this.sprite.setFlipX(this.facing > 0);
    this.shadow.setPosition(this.worldX, this.groundY + 8);
  }

  takeDamage(amount, source) {
    if (this.state === BS.DEAD) return;
    this.hp -= amount;

    // Brief tint flash on every hit
    this.scene.tweens.add({ targets: this.sprite, alpha: 0.25, duration: 50, yoyo: true, repeat: 1,
      onComplete: () => this.sprite.setAlpha(1) });

    if (this.hp <= 0) {
      this.hp    = 0;
      this.state = BS.DEAD;
      this.dead  = true;
      this._setAnim('spider-death');
      this.scene.cameras.main.shake(600, 0.018);
      this.scene._floatText(this.worldX, this.groundY - 80, '🕷 BOSS DEFEATED!', 0xFFD700);

      this.scene.time.delayedCall(800, () => {
        this.scene.tweens.add({
          targets: [this.sprite, this.shadow, this.hpBarBg, this.hpBarTrack, this.hpBarFill, this.hpBarLabel],
          alpha: 0, duration: 700,
          onComplete: () => {
            [this.sprite, this.shadow, this.hpBarBg, this.hpBarTrack, this.hpBarFill, this.hpBarLabel]
              .forEach(o => o.destroy());
          }
        });
      });
      return;
    }

    // Only stagger from heavy hits (boomerang or melee). Bullets just chip damage —
    // a steady machine-gun stream must NOT lock the boss in HURT and prevent it from
    // attacking. Stagger also rate-limited so the boss isn't pinned even by big hits.
    const heavy = (source !== 'bullet');
    const recovered = (this.hurtTimer || 0) <= 0;
    if (heavy && recovered) {
      this.state     = BS.HURT;
      this.hurtTimer = 0.3;
      this._setAnim('spider-hurt');
    }
  }
}

// =============================================================================
// DOOR
// =============================================================================
class Door {
  constructor(scene, x, y, area) {
    this.scene  = scene;
    this.worldX = x;
    this.area   = area;
    this.open   = false;

    // Massive ancient tree trunk that fills the screen vertically — visually a gateway
    // big-tree is 128×128. With origin (0.5, 1) and scale 4×, the tree extends ~512px up
    // from the ground. Plenty to fill the full vertical screen as the player approaches.
    this.treeBack = scene.add.image(x, y - 30, 'big-tree')
      .setOrigin(0.5, 1).setDepth(8.5).setScale(4.0).setTint(0xddccbb);
    // Slight lower trunk piece for thicker base
    this.trunkBase = scene.add.rectangle(x, y - 6, 56, 60, 0x2a1808)
      .setOrigin(0.5, 1).setDepth(8.6);

    // The actual door sprite (PixelLab tree-door) at base of the tree
    this.sprite = scene.add.image(x, y - 4, 'door')
      .setDepth(9).setOrigin(0.5, 1).setScale(1.5);

    // "Clear enemies + collect key" hint above door (well above the door, not at top of tree)
    this.hintBg = scene.add.rectangle(x, y - 165, 200, 22, 0x000000, 0.78).setDepth(12);
    this.hintTx = scene.add.text(x, y - 165,
      '⚔ Clear area & 🔑 get key', { fontSize: '9px', color: '#FFDD77', fontFamily: 'monospace' })
      .setDepth(13).setOrigin(0.5);

    // Soft glow at the door base to draw attention
    this.glow = scene.add.ellipse(x, y, 90, 24, 0xFFD24A, 0.18).setDepth(8.4);
    scene.tweens.add({ targets: this.glow, alpha: 0.32, scaleX: 1.15, duration: 1200,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  openDoor(scene) {
    if (this.open) return;
    this.open = true;
    this.hintBg.destroy();
    this.hintTx.destroy();

    // Door-open animation: closed door scales/rotates as if swinging open, then swaps
    // texture to door-open and stays visible. Tree backdrop remains so the player can
    // see the archway leading deeper into the forest.
    scene.tweens.add({
      targets: this.sprite,
      scaleX: 0, duration: 320, ease: 'Cubic.easeIn',
      onComplete: () => {
        this.sprite.setTexture('door-open');
        this.sprite.setScale(1.5);  // back to display scale
        this.sprite.setAlpha(0);
        scene.tweens.add({ targets: this.sprite, scaleX: 1.5, alpha: 1, duration: 320, ease: 'Cubic.easeOut' });
        // Glowing dust-puff inside the archway
        for (let i = 0; i < 12; i++) {
          const px = this.worldX + (Math.random() - 0.5) * 60;
          const py = scene.cameras.main.scrollY + this.sprite.y - 60 + Math.random() * 60;
          const sp = scene.add.circle(px, py, 2 + Math.random() * 2, 0x88FFAA, 0.9).setDepth(11);
          scene.tweens.add({
            targets: sp,
            y: py - 40 - Math.random() * 30,
            alpha: 0, duration: 700 + Math.random() * 400,
            onComplete: () => sp.destroy(),
          });
        }
      }
    });

    // Glow stays — pulses softly to indicate the open passage
    scene.tweens.killTweensOf(this.glow);
    scene.tweens.add({
      targets: this.glow, fillColor: 0x66FF99, alpha: 0.45, duration: 600,
    });
    scene.tweens.add({
      targets: this.glow, scaleX: 1.25, scaleY: 1.25, duration: 1400,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    scene._floatText(this.worldX, this.scene.cameras.main.scrollY + 200, 'DOOR OPEN!', 0x00FF88);
  }
}

// =============================================================================
// KEY ITEM
// =============================================================================
class KeyItem {
  constructor(scene, x, y, area) {
    this.scene     = scene;
    this.worldX    = x;
    this.groundY   = y;
    this.area      = area;
    this.collected = false;

    this.sprite = scene.add.image(x, y, 'key').setDepth(8).setScale(1.6);
    scene.tweens.add({ targets: this.sprite, y: y - 12, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: this.sprite, alpha: 0.65, duration: 380, yoyo: true, repeat: -1 });
  }

  collect() {
    if (this.collected) return;
    this.collected = true;
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.add({
      targets: this.sprite, y: this.groundY - 60, alpha: 0, scaleX: 2.5, scaleY: 2.5,
      duration: 380, onComplete: () => this.sprite.destroy()
    });
  }
}

// =============================================================================
// HUD
// =============================================================================
class HUD {
  constructor(scene) {
    this.scene = scene;
    const W = CFG.W;
    const sf = 0; // scrollFactor

    // Background strip
    scene.add.rectangle(W / 2, 20, W, 40, 0x000000, 0.65).setScrollFactor(sf).setDepth(150);

    // HP label + bar
    scene.add.text(10, 8, 'MAKS', { fontSize: '9px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold' })
      .setScrollFactor(sf).setDepth(151);
    this.hpBg = scene.add.rectangle(54, 15, 120, 10, 0x550000).setScrollFactor(sf).setDepth(151).setOrigin(0, 0.5);
    this.hpFill = scene.add.rectangle(54, 15, 120, 10, 0xFF3333).setScrollFactor(sf).setDepth(152).setOrigin(0, 0.5);
    this.hpTxt = scene.add.text(178, 9, '100', { fontSize: '9px', color: '#ff9999', fontFamily: 'monospace' })
      .setScrollFactor(sf).setDepth(152);

    // Score
    this.scoreTxt = scene.add.text(W / 2, 8, 'SCORE: 0', {
      fontSize: '12px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold'
    }).setScrollFactor(sf).setDepth(151).setOrigin(0.5, 0);

    // Area + key count
    this.areaTxt = scene.add.text(W - 10, 8, 'AREA 1/4  🔑 0', {
      fontSize: '9px', color: '#aaffaa', fontFamily: 'monospace'
    }).setScrollFactor(sf).setDepth(151).setOrigin(1, 0);

    // Gun icon (hidden until pickup)
    this.gunTxt = scene.add.text(W - 10, 22, '', {
      fontSize: '9px', color: '#FFAA00', fontFamily: 'monospace', fontStyle: 'bold'
    }).setScrollFactor(sf).setDepth(151).setOrigin(1, 0);

    // Controls reminder (bottom)
    scene.add.text(W / 2, CFG.H - 10, '← → ↑ ↓ Move   X Jump   Z Attack   S Boomerang', {
      fontSize: '8px', color: '#446644', fontFamily: 'monospace'
    }).setScrollFactor(sf).setDepth(150).setOrigin(0.5, 1);

    // Combo text
    this.comboTxt = scene.add.text(W / 2, 52, '', {
      fontSize: '22px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4
    }).setScrollFactor(sf).setDepth(152).setOrigin(0.5, 0).setAlpha(0);
  }

  update(player, score, keys, area) {
    const r = player.hp / player.maxHp;
    this.hpFill.setScale(r, 1);
    this.hpFill.setFillStyle(r > 0.5 ? 0x33FF33 : r > 0.25 ? 0xFF8800 : 0xFF1111);
    this.hpTxt.setText(player.hp);
    this.scoreTxt.setText(`SCORE: ${score.toLocaleString()}`);
    const areaLabel = area >= 3 ? 'BOSS!' : `AREA ${area + 1}/4  🔑 ${keys}`;
    this.areaTxt.setText(areaLabel);
  }

  showGunIcon() {
    this.gunTxt.setText('🔫 ARMED');
    this.scene.tweens.add({ targets: this.gunTxt, scaleX: 1.3, scaleY: 1.3, duration: 200, yoyo: true });
  }

  showCombo(count) {
    if (count < 2) return;
    const labels = ['', '', '2x COMBO!', '3x COMBO!', '4x COMBO!!', '5x SUPER COMBO!!!'];
    this.comboTxt.setText(labels[Math.min(count, labels.length - 1)] || `${count}x COMBO!!!`);
    this.scene.tweens.killTweensOf(this.comboTxt);
    this.comboTxt.setAlpha(1).setScale(1);
    this.scene.tweens.add({
      targets: this.comboTxt, alpha: 0, scaleX: 1.6, scaleY: 1.6, delay: 900, duration: 350
    });
  }
}

// =============================================================================
// PHASER GAME INIT
// =============================================================================
new Phaser.Game({
  type: Phaser.AUTO,
  width:  CFG.W,
  height: CFG.H,
  zoom:   CFG.SCALE,
  backgroundColor: '#061008',
  pixelArt: true,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, PreloadScene, CutsceneScene, GameScene],
});
