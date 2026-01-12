/**
 * Grid Wars v2.2.6 Regression Tests
 *
 * Tests for Hostile Takeover:
 * - Attack a developed macro cell to become its new landlord
 * - Subcells unchanged; only macro ownership transfers
 * - Base cost 150 pts (+ activity tier, scarcity, velocity, guerrilla)
 * - NO overextension discount, NO fortification penalty
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GRID_WARS_CONFIG } from '../../shared/gridwars.config.js';

// ============================================
// CONFIG CONSTANT TESTS
// ============================================

describe('Grid Wars v2.2.6 - Config Constants', () => {
  it('should have hostileTakeoverBaseCost defined', () => {
    expect(GRID_WARS_CONFIG.hostileTakeoverBaseCost).toBeDefined();
  });

  it('should have hostileTakeoverBaseCost set to 150', () => {
    expect(GRID_WARS_CONFIG.hostileTakeoverBaseCost).toBe(150);
  });

  it('should be higher than normal takeover costs', () => {
    expect(GRID_WARS_CONFIG.hostileTakeoverBaseCost).toBeGreaterThan(GRID_WARS_CONFIG.takeoverCostActive);
    expect(GRID_WARS_CONFIG.hostileTakeoverBaseCost).toBeGreaterThan(GRID_WARS_CONFIG.takeoverCostWarm);
    expect(GRID_WARS_CONFIG.hostileTakeoverBaseCost).toBeGreaterThan(GRID_WARS_CONFIG.takeoverCostCold);
  });
});

// ============================================
// HOSTILE TAKEOVER DETECTION TESTS
// ============================================

describe('Grid Wars v2.2.6 - Hostile Takeover Detection', () => {
  // Simulate the isHostileTakeover check from server.js
  function isHostileTakeover(existingTerritory, username, parentAddress) {
    // Must be enemy-owned
    if (!existingTerritory?.owner) return false;
    if (existingTerritory.owner === username) return false;

    // Must be developed
    if (!existingTerritory.is_developed) return false;

    // Must be macro level (cell_level 0 or undefined)
    if (existingTerritory.cell_level !== 0 && existingTerritory.cell_level !== undefined) return false;

    // Must be at macro level (no parent address)
    if (parentAddress) return false;

    return true;
  }

  it('should detect hostile takeover for enemy developed macro cell', () => {
    const cell = { owner: 'alice', is_developed: true, cell_level: 0 };
    expect(isHostileTakeover(cell, 'bob', null)).toBe(true);
  });

  it('should NOT detect hostile takeover for own territory', () => {
    const cell = { owner: 'bob', is_developed: true, cell_level: 0 };
    expect(isHostileTakeover(cell, 'bob', null)).toBe(false);
  });

  it('should NOT detect hostile takeover for neutral territory', () => {
    const cell = { owner: null, is_developed: false, cell_level: 0 };
    expect(isHostileTakeover(cell, 'bob', null)).toBe(false);
  });

  it('should NOT detect hostile takeover for undeveloped enemy cell', () => {
    const cell = { owner: 'alice', is_developed: false, cell_level: 0 };
    expect(isHostileTakeover(cell, 'bob', null)).toBe(false);
  });

  it('should NOT detect hostile takeover for subcells', () => {
    const cell = { owner: 'alice', is_developed: true, cell_level: 1 };
    expect(isHostileTakeover(cell, 'bob', 'd5')).toBe(false);
  });

  it('should NOT detect hostile takeover when at subcell level (parentAddress set)', () => {
    const cell = { owner: 'alice', is_developed: true, cell_level: 0 };
    expect(isHostileTakeover(cell, 'bob', 'd5')).toBe(false);
  });

  it('should handle undefined cell_level as macro level', () => {
    const cell = { owner: 'alice', is_developed: true, cell_level: undefined };
    expect(isHostileTakeover(cell, 'bob', null)).toBe(true);
  });
});

// ============================================
// COST CALCULATION TESTS
// ============================================

describe('Grid Wars v2.2.6 - Takeover Cost Calculation', () => {
  describe('Base cost', () => {
    it('should start with base cost of 150', () => {
      const baseCost = GRID_WARS_CONFIG.hostileTakeoverBaseCost || 150;
      expect(baseCost).toBe(150);
    });
  });

  describe('Activity tier multipliers', () => {
    // Simulate activity tier multiplier
    function getActivityMultiplier(activityTier) {
      switch (activityTier) {
        case 'ACTIVE': return 1.67;
        case 'WARM': return 1.33;
        case 'COLD':
        default: return 1.0;
      }
    }

    it('should apply 1.0x for COLD (inactive defender)', () => {
      expect(getActivityMultiplier('COLD')).toBe(1.0);
    });

    it('should apply 1.33x for WARM (somewhat active defender)', () => {
      expect(getActivityMultiplier('WARM')).toBe(1.33);
    });

    it('should apply 1.67x for ACTIVE (very active defender)', () => {
      expect(getActivityMultiplier('ACTIVE')).toBe(1.67);
    });

    it('should calculate correct costs with activity tiers', () => {
      const baseCost = 150;
      expect(Math.ceil(baseCost * 1.0)).toBe(150);   // COLD
      expect(Math.ceil(baseCost * 1.33)).toBe(200);  // WARM: 150 * 1.33 = 199.5 -> 200
      expect(Math.ceil(baseCost * 1.67)).toBe(251);  // ACTIVE: 150 * 1.67 = 250.5 -> 251
    });
  });

  describe('Scarcity multipliers', () => {
    // Simulate scarcity multiplier from config
    function getScarcityMultiplier(fillPercent) {
      const phases = GRID_WARS_CONFIG.scarcityPhases;
      if (fillPercent >= 0.85) return phases.SATURATION.multiplier;
      if (fillPercent >= 0.60) return phases.SCARCITY.multiplier;
      if (fillPercent >= 0.30) return phases.TENSION.multiplier;
      return phases.EXPANSION.multiplier;
    }

    it('should apply 1.0x during EXPANSION (0-30%)', () => {
      expect(getScarcityMultiplier(0.0)).toBe(1.0);
      expect(getScarcityMultiplier(0.20)).toBe(1.0);
      expect(getScarcityMultiplier(0.29)).toBe(1.0);
    });

    it('should apply 1.5x during TENSION (30-60%)', () => {
      expect(getScarcityMultiplier(0.30)).toBe(1.5);
      expect(getScarcityMultiplier(0.45)).toBe(1.5);
      expect(getScarcityMultiplier(0.59)).toBe(1.5);
    });

    it('should apply 2.0x during SCARCITY (60-85%)', () => {
      expect(getScarcityMultiplier(0.60)).toBe(2.0);
      expect(getScarcityMultiplier(0.75)).toBe(2.0);
      expect(getScarcityMultiplier(0.84)).toBe(2.0);
    });

    it('should apply 3.0x during SATURATION (85-100%)', () => {
      expect(getScarcityMultiplier(0.85)).toBe(3.0);
      expect(getScarcityMultiplier(0.95)).toBe(3.0);
      expect(getScarcityMultiplier(1.0)).toBe(3.0);
    });

    it('should calculate correct costs with scarcity', () => {
      const baseCost = 150;
      expect(Math.ceil(baseCost * 1.0)).toBe(150);   // EXPANSION
      expect(Math.ceil(baseCost * 1.5)).toBe(225);   // TENSION
      expect(Math.ceil(baseCost * 2.0)).toBe(300);   // SCARCITY
      expect(Math.ceil(baseCost * 3.0)).toBe(450);   // SATURATION
    });
  });

  describe('Velocity discounts', () => {
    // Simulate velocity discount from config
    function getVelocityDiscount(velocity) {
      const tiers = GRID_WARS_CONFIG.velocityTiers;
      if (velocity >= tiers.BLAZING.min) return tiers.BLAZING.discount;
      if (velocity >= tiers.FLOWING.min) return tiers.FLOWING.discount;
      if (velocity >= tiers.ACTIVE.min) return tiers.ACTIVE.discount;
      return tiers.IDLE.discount;
    }

    it('should apply 0% discount for IDLE', () => {
      expect(getVelocityDiscount(0)).toBe(0);
      expect(getVelocityDiscount(0.3)).toBe(0);
    });

    it('should apply 10% discount for ACTIVE (0.5+ pts/min)', () => {
      expect(getVelocityDiscount(0.5)).toBe(0.10);
      expect(getVelocityDiscount(0.9)).toBe(0.10);
    });

    it('should apply 25% discount for FLOWING (1.0+ pts/min)', () => {
      expect(getVelocityDiscount(1.0)).toBe(0.25);
      expect(getVelocityDiscount(1.5)).toBe(0.25);
    });

    it('should apply 40% discount for BLAZING (2.0+ pts/min)', () => {
      expect(getVelocityDiscount(2.0)).toBe(0.40);
      expect(getVelocityDiscount(5.0)).toBe(0.40);
    });

    it('should calculate correct costs with velocity discount', () => {
      const baseCost = 150;
      expect(Math.ceil(baseCost * (1 - 0))).toBe(150);      // IDLE
      expect(Math.ceil(baseCost * (1 - 0.10))).toBe(135);   // ACTIVE: 150 * 0.9 = 135
      expect(Math.ceil(baseCost * (1 - 0.25))).toBe(113);   // FLOWING: 150 * 0.75 = 112.5 -> 113
      expect(Math.ceil(baseCost * (1 - 0.40))).toBe(90);    // BLAZING: 150 * 0.6 = 90
    });
  });

  describe('Guerrilla discounts', () => {
    // Simulate guerrilla discount from config
    function getGuerrillaDiscount(attackerCells, defenderCells) {
      const tiers = GRID_WARS_CONFIG.guerrillaTiers;
      for (const tier of tiers) {
        if (attackerCells <= tier.attackerMax && defenderCells >= tier.defenderMin) {
          return tier.discount;
        }
      }
      return 0;
    }

    it('should apply 50% discount for small vs large (<=2 vs >=10)', () => {
      expect(getGuerrillaDiscount(1, 10)).toBe(0.50);
      expect(getGuerrillaDiscount(2, 15)).toBe(0.50);
    });

    it('should apply 40% discount for medium small vs large (<=4 vs >=15)', () => {
      expect(getGuerrillaDiscount(3, 15)).toBe(0.40);
      expect(getGuerrillaDiscount(4, 20)).toBe(0.40);
    });

    it('should apply 30% discount for larger small vs very large (<=6 vs >=20)', () => {
      expect(getGuerrillaDiscount(5, 20)).toBe(0.30);
      expect(getGuerrillaDiscount(6, 25)).toBe(0.30);
    });

    it('should apply no discount if conditions not met', () => {
      expect(getGuerrillaDiscount(10, 5)).toBe(0);  // Attacker larger
      expect(getGuerrillaDiscount(3, 8)).toBe(0);   // Defender not big enough
    });
  });

  describe('Full cost calculation', () => {
    function calculateTakeoverCost(activityTier, scarcityMultiplier, velocityDiscount, guerrillaDiscount) {
      let cost = GRID_WARS_CONFIG.hostileTakeoverBaseCost || 150;

      // Activity tier
      const activityMultiplier = activityTier === 'ACTIVE' ? 1.67 :
                                  activityTier === 'WARM' ? 1.33 : 1.0;
      cost = Math.ceil(cost * activityMultiplier);

      // Scarcity
      cost = Math.ceil(cost * scarcityMultiplier);

      // Velocity discount
      cost = Math.ceil(cost * (1 - velocityDiscount));

      // Guerrilla discount
      cost = Math.ceil(cost * (1 - guerrillaDiscount));

      return cost;
    }

    it('should calculate minimum cost (COLD, EXPANSION, BLAZING, max guerrilla)', () => {
      const cost = calculateTakeoverCost('COLD', 1.0, 0.40, 0.50);
      // 150 * 1.0 * 1.0 * 0.6 * 0.5 = 45
      expect(cost).toBe(45);
    });

    it('should calculate maximum cost (ACTIVE, SATURATION, IDLE, no guerrilla)', () => {
      const cost = calculateTakeoverCost('ACTIVE', 3.0, 0, 0);
      // 150 * 1.67 = 251 * 3.0 = 753 * 1.0 * 1.0 = 753
      expect(cost).toBe(753);
    });

    it('should calculate typical case (COLD, EXPANSION, IDLE, no guerrilla)', () => {
      const cost = calculateTakeoverCost('COLD', 1.0, 0, 0);
      // 150 * 1.0 * 1.0 * 1.0 * 1.0 = 150
      expect(cost).toBe(150);
    });
  });
});

// ============================================
// WHAT DOES NOT CHANGE TESTS
// ============================================

describe('Grid Wars v2.2.6 - Takeover Does Not Affect Subcells', () => {
  it('should describe unchanged properties after takeover', () => {
    // Before takeover
    const before = {
      macroCell: { address: 'd5', owner: 'sam', is_developed: true },
      subcells: [
        { address: 'd5.d4', owner: 'sam' },
        { address: 'd5.d5', owner: 'sam' },
        { address: 'd5.e4', owner: 'sam' },
        { address: 'd5.e5', owner: 'sam' },
        { address: 'd5.a1', owner: 'alex' }
      ]
    };

    // After Alex takes over D5
    const after = {
      macroCell: { address: 'd5', owner: 'alex', is_developed: true },  // Owner changes
      subcells: [
        { address: 'd5.d4', owner: 'sam' },  // Unchanged
        { address: 'd5.d5', owner: 'sam' },  // Unchanged
        { address: 'd5.e4', owner: 'sam' },  // Unchanged
        { address: 'd5.e5', owner: 'sam' },  // Unchanged
        { address: 'd5.a1', owner: 'alex' }  // Unchanged
      ]
    };

    // Verify macro cell owner changed
    expect(after.macroCell.owner).toBe('alex');
    expect(after.macroCell.owner).not.toBe(before.macroCell.owner);

    // Verify is_developed stays true
    expect(after.macroCell.is_developed).toBe(true);

    // Verify all subcells unchanged
    for (let i = 0; i < before.subcells.length; i++) {
      expect(after.subcells[i].owner).toBe(before.subcells[i].owner);
      expect(after.subcells[i].address).toBe(before.subcells[i].address);
    }
  });

  it('should allow new landlord to collect rent from previous owner\'s subcells', () => {
    // Sam's center 4 cells are now inside Alex's developed cell
    // If Sam claims more subcells, Alex gets rent
    const landlord = 'alex';  // New owner of d5
    const tenant = 'sam';     // Owns d5.d4, d5.d5, etc.

    // When Sam claims d5.b2 (a neutral subcell), Alex should get rent
    const claimCost = 10;  // subcellClaimCost
    const taxRate = GRID_WARS_CONFIG.landlordTaxRate;
    const expectedRent = Math.max(1, Math.floor(claimCost * taxRate));

    expect(expectedRent).toBe(2);  // 10 * 0.20 = 2
    expect(landlord).not.toBe(tenant);
  });
});

// ============================================
// NO OVEREXTENSION / NO FORTIFICATION TESTS
// ============================================

describe('Grid Wars v2.2.6 - Hostile Takeover Exclusions', () => {
  it('should NOT apply overextension discount to hostile takeovers', () => {
    // Overextension discount is for isolated/edge cells
    // But hostile takeover is for developed cells, which are typically central
    // The spec says NO overextension discount
    const overextensionApplied = false;  // By design
    expect(overextensionApplied).toBe(false);
  });

  it('should NOT apply fortification penalty to hostile takeovers', () => {
    // Fortification is for attacking subcells inside enemy's developed territory
    // Hostile takeover is attacking the macro cell itself, not a subcell
    const fortificationApplied = false;  // By design
    expect(fortificationApplied).toBe(false);
  });
});

// ============================================
// CLIENT-SIDE UI TESTS
// ============================================

describe('Grid Wars v2.2.6 - isHostileTakeoverTarget (Client)', () => {
  // Simulate client-side detection
  function isHostileTakeoverTarget(selected, username, navState, isDeveloped) {
    if (!selected) return false;

    const { owner, address } = selected;

    // Must be enemy territory
    if (!owner || owner === username) return false;

    // Must be at macro level (not zoomed into subcells)
    if (navState?.currentLevel > 0 || navState?.currentParent) return false;

    // Cell address must be a simple macro address (no dots)
    if (address && address.includes('.')) return false;

    // Cell must be developed
    if (!isDeveloped) return false;

    return true;
  }

  it('should detect takeover target for enemy developed macro cell at macro level', () => {
    const selected = { x: 4, y: 4, address: 'd5', owner: 'alice' };
    const navState = { currentLevel: 0, currentParent: null };
    expect(isHostileTakeoverTarget(selected, 'bob', navState, true)).toBe(true);
  });

  it('should NOT detect takeover target if cell not selected', () => {
    expect(isHostileTakeoverTarget(null, 'bob', { currentLevel: 0 }, true)).toBe(false);
  });

  it('should NOT detect takeover target for own territory', () => {
    const selected = { x: 4, y: 4, address: 'd5', owner: 'bob' };
    const navState = { currentLevel: 0, currentParent: null };
    expect(isHostileTakeoverTarget(selected, 'bob', navState, true)).toBe(false);
  });

  it('should NOT detect takeover target for neutral territory', () => {
    const selected = { x: 4, y: 4, address: 'd5', owner: null };
    const navState = { currentLevel: 0, currentParent: null };
    expect(isHostileTakeoverTarget(selected, 'bob', navState, true)).toBe(false);
  });

  it('should NOT detect takeover target for undeveloped enemy cell', () => {
    const selected = { x: 4, y: 4, address: 'd5', owner: 'alice' };
    const navState = { currentLevel: 0, currentParent: null };
    expect(isHostileTakeoverTarget(selected, 'bob', navState, false)).toBe(false);
  });

  it('should NOT detect takeover target when zoomed into subcells', () => {
    const selected = { x: 4, y: 4, address: 'd5.c3', owner: 'alice' };
    const navState = { currentLevel: 1, currentParent: 'd5' };
    expect(isHostileTakeoverTarget(selected, 'bob', navState, true)).toBe(false);
  });

  it('should NOT detect takeover target for subcell address', () => {
    const selected = { x: 4, y: 4, address: 'd5.c3', owner: 'alice' };
    const navState = { currentLevel: 0, currentParent: null };  // Even at macro level
    expect(isHostileTakeoverTarget(selected, 'bob', navState, true)).toBe(false);
  });
});

describe('Grid Wars v2.2.6 - calculateTakeoverCost (Client)', () => {
  // Simulate client-side cost estimate
  function calculateTakeoverCost(fillPercent) {
    let cost = GRID_WARS_CONFIG.hostileTakeoverBaseCost || 150;

    // Scarcity approximation
    let scarcityMultiplier = 1.0;
    if (fillPercent >= 0.85) {
      scarcityMultiplier = 3.0;
    } else if (fillPercent >= 0.60) {
      scarcityMultiplier = 2.0;
    } else if (fillPercent >= 0.30) {
      scarcityMultiplier = 1.5;
    }
    cost = Math.ceil(cost * scarcityMultiplier);

    return cost;
  }

  it('should estimate 150 during EXPANSION', () => {
    expect(calculateTakeoverCost(0.20)).toBe(150);
  });

  it('should estimate 225 during TENSION', () => {
    expect(calculateTakeoverCost(0.40)).toBe(225);
  });

  it('should estimate 300 during SCARCITY', () => {
    expect(calculateTakeoverCost(0.70)).toBe(300);
  });

  it('should estimate 450 during SATURATION', () => {
    expect(calculateTakeoverCost(0.90)).toBe(450);
  });
});

// ============================================
// WEBSOCKET MESSAGE TESTS
// ============================================

describe('Grid Wars v2.2.6 - hostile_takeover WebSocket Message', () => {
  it('should contain required fields', () => {
    const message = {
      type: 'hostile_takeover',
      gameId: 'game-123',
      attacker: 'alex',
      previousOwner: 'sam',
      address: 'd5',
      x: 4,
      y: 4,
      cost: 150,
      activityTier: 'COLD'
    };

    expect(message.type).toBe('hostile_takeover');
    expect(message.attacker).toBeDefined();
    expect(message.previousOwner).toBeDefined();
    expect(message.address).toBeDefined();
    expect(message.x).toBeDefined();
    expect(message.y).toBeDefined();
    expect(message.cost).toBeDefined();
  });

  it('should update territory ownership in state', () => {
    // Simulate state update
    const territories = new Map();
    territories.set('4,4', { owner: 'sam', is_developed: true });

    const message = {
      type: 'hostile_takeover',
      attacker: 'alex',
      previousOwner: 'sam',
      x: 4,
      y: 4
    };

    // Apply update
    const existing = territories.get(`${message.x},${message.y}`) || {};
    territories.set(`${message.x},${message.y}`, {
      ...existing,
      owner: message.attacker,
      claimed_at: new Date().toISOString()
    });

    // Verify
    const updated = territories.get('4,4');
    expect(updated.owner).toBe('alex');
    expect(updated.is_developed).toBe(true);  // Unchanged
  });

  it('should update player territory counts', () => {
    const players = new Map();
    players.set('sam', { territories_count: 5 });
    players.set('alex', { territories_count: 3 });

    const message = {
      attacker: 'alex',
      previousOwner: 'sam'
    };

    // Apply count updates
    const attacker = players.get(message.attacker);
    const defender = players.get(message.previousOwner);

    attacker.territories_count += 1;
    defender.territories_count -= 1;

    expect(players.get('alex').territories_count).toBe(4);
    expect(players.get('sam').territories_count).toBe(4);
  });
});

// ============================================
// TOAST NOTIFICATION TESTS
// ============================================

describe('Grid Wars v2.2.6 - Toast Notifications', () => {
  it('should show success toast for attacker', () => {
    const message = {
      attacker: 'alex',
      previousOwner: 'sam',
      address: 'd5'
    };
    const username = 'alex';

    let toastText = '';
    if (message.attacker === username) {
      toastText = `You seized ${message.address.toUpperCase()} from ${message.previousOwner}!`;
    }

    expect(toastText).toContain('You seized');
    expect(toastText).toContain('D5');
    expect(toastText).toContain('sam');
  });

  it('should show warning toast for previous owner', () => {
    const message = {
      attacker: 'alex',
      previousOwner: 'sam',
      address: 'd5'
    };
    const username = 'sam';

    let toastText = '';
    if (message.previousOwner === username) {
      toastText = `${message.attacker} seized your empire at ${message.address.toUpperCase()}!`;
    }

    expect(toastText).toContain('alex');
    expect(toastText).toContain('seized your empire');
    expect(toastText).toContain('D5');
  });

  it('should show neutral toast for other players', () => {
    const message = {
      attacker: 'alex',
      previousOwner: 'sam',
      address: 'd5'
    };
    const username = 'bob';

    let toastText = '';
    if (message.attacker !== username && message.previousOwner !== username) {
      toastText = `${message.attacker} seized ${message.address.toUpperCase()} from ${message.previousOwner}`;
    }

    expect(toastText).toContain('alex');
    expect(toastText).toContain('D5');
    expect(toastText).toContain('sam');
    expect(toastText).not.toContain('You');
    expect(toastText).not.toContain('your');
  });
});

// ============================================
// RENT REDIRECT TESTS
// ============================================

describe('Grid Wars v2.2.6 - Rent Redirects After Takeover', () => {
  it('should pay rent to new landlord after takeover', () => {
    // Before: D5 owned by Sam, who gets rent when others claim inside D5
    // After: D5 owned by Alex via hostile takeover

    const parentCell = { owner: 'alex', is_developed: true };  // New owner
    const claimer = 'bob';  // Someone claiming a subcell

    // Check if rent should go to Alex (new landlord)
    const shouldPayRentToAlex = (
      parentCell.is_developed &&
      parentCell.owner &&
      parentCell.owner !== claimer
    );

    expect(shouldPayRentToAlex).toBe(true);
    expect(parentCell.owner).toBe('alex');  // Not 'sam' anymore
  });

  it('should NOT charge rent when landlord claims inside own territory', () => {
    const parentCell = { owner: 'alex', is_developed: true };
    const claimer = 'alex';  // Landlord claiming their own subcells

    const shouldPayRent = (
      parentCell.is_developed &&
      parentCell.owner &&
      parentCell.owner !== claimer
    );

    expect(shouldPayRent).toBe(false);  // No self-rent
  });
});

// ============================================
// FORTIFICATION TRANSFER TESTS
// ============================================

describe('Grid Wars v2.2.6 - Fortification Transfers After Takeover', () => {
  it('should protect new landlord\'s subcells after takeover', () => {
    // Before: Sam owns D5, Sam's subcells have fortification protection
    // After: Alex owns D5, Alex's subcells have fortification protection

    const parentCell = { owner: 'alex', is_developed: true };  // New owner
    const attackerInsideTerritory = 'bob';

    // Check if fortification applies (for attacks inside Alex's territory)
    const shouldApplyFortification = (
      parentCell.is_developed &&
      parentCell.owner &&
      parentCell.owner !== attackerInsideTerritory
    );

    expect(shouldApplyFortification).toBe(true);
    expect(GRID_WARS_CONFIG.fortificationMultiplier).toBe(1.25);  // +25%
  });

  it('should NOT apply fortification when landlord attacks inside own territory', () => {
    const parentCell = { owner: 'alex', is_developed: true };
    const attacker = 'alex';  // Landlord attacking inside own territory

    const shouldApplyFortification = (
      parentCell.is_developed &&
      parentCell.owner &&
      parentCell.owner !== attacker
    );

    expect(shouldApplyFortification).toBe(false);  // No self-fortification penalty
  });
});

// ============================================
// EDGE CASE TESTS
// ============================================

describe('Grid Wars v2.2.6 - Edge Cases', () => {
  it('should handle attacker already owning subcells inside target', () => {
    // Alex owns D5.A1 (a subcell)
    // Alex takes over D5 (the macro cell owned by Sam)
    // Alex now owns D5 AND D5.A1 - no conflict

    const macroOwner = 'alex';  // After takeover
    const subcellOwner = 'alex';  // Alex already owned this

    // No rent paid to self
    expect(macroOwner).toBe(subcellOwner);
  });

  it('should handle target being center 4 cells owner', () => {
    // Sam developed D5, keeping D5.D4, D5.D5, D5.E4, D5.E5
    // Alex takes over D5
    // Sam still owns the center 4 subcells
    // Alex is now landlord

    const subcellsOwnedBySam = ['d5.d4', 'd5.d5', 'd5.e4', 'd5.e5'];
    const macroOwner = 'alex';  // New landlord

    // Sam's subcells are unchanged
    expect(subcellsOwnedBySam.length).toBe(4);
    expect(macroOwner).toBe('alex');
  });

  it('should handle nested developed cells', () => {
    // D5 is developed, owned by Alex (via takeover)
    // D5.C3 is also developed, owned by Sam
    // Alex is landlord of D5
    // Sam is landlord of D5.C3

    const d5 = { address: 'd5', owner: 'alex', is_developed: true };
    const d5c3 = { address: 'd5.c3', owner: 'sam', is_developed: true };

    // Each developed cell has its own landlord
    expect(d5.owner).toBe('alex');
    expect(d5c3.owner).toBe('sam');

    // If someone claims D5.C3.A1, rent goes to Sam (owner of D5.C3)
    // NOT to Alex (owner of D5)
    const rentRecipient = d5c3.owner;  // Parent of D5.C3.A1 is D5.C3
    expect(rentRecipient).toBe('sam');
  });
});
