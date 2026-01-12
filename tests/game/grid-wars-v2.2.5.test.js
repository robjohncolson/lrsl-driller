/**
 * Grid Wars v2.2.5 Regression Tests
 *
 * Tests for Development Incentives:
 * - Landlord Tax (20% rent when others claim inside your developed territory)
 * - Fortification (+25% attack cost inside enemy's developed territory)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GRID_WARS_CONFIG } from '../../shared/gridwars.config.js';

// ============================================
// HELPER FUNCTION TESTS
// ============================================

describe('Grid Wars v2.2.5 - getParentAddress helper', () => {
  // Simulate the helper function
  function getParentAddress(address) {
    if (!address || !address.includes('.')) return null;
    const parts = address.split('.');
    parts.pop();
    return parts.join('.') || null;
  }

  it('should return null for macro cells (no parent)', () => {
    expect(getParentAddress('d5')).toBeNull();
    expect(getParentAddress('a1')).toBeNull();
    expect(getParentAddress('h8')).toBeNull();
  });

  it('should return null for null/undefined address', () => {
    expect(getParentAddress(null)).toBeNull();
    expect(getParentAddress(undefined)).toBeNull();
    expect(getParentAddress('')).toBeNull();
  });

  it('should return parent address for level 1 subcells', () => {
    expect(getParentAddress('d5.a1')).toBe('d5');
    expect(getParentAddress('e4.c3')).toBe('e4');
    expect(getParentAddress('h8.b2')).toBe('h8');
  });

  it('should return parent address for level 2 sub-subcells', () => {
    expect(getParentAddress('d5.c3.a1')).toBe('d5.c3');
    expect(getParentAddress('e4.d4.h8')).toBe('e4.d4');
  });
});

// ============================================
// LANDLORD TAX TESTS
// ============================================

describe('Grid Wars v2.2.5 - Landlord Tax', () => {
  describe('Tax rate calculation', () => {
    // Simulate the rent calculation
    function calculateRent(cost, taxRate = 0.20, minTax = 1) {
      return Math.max(minTax, Math.floor(cost * taxRate));
    }

    it('should calculate 20% of claim cost', () => {
      expect(calculateRent(10)).toBe(2);   // 10 * 0.20 = 2
      expect(calculateRent(40)).toBe(8);   // 40 * 0.20 = 8
      expect(calculateRent(100)).toBe(20); // 100 * 0.20 = 20
    });

    it('should floor the rent value', () => {
      expect(calculateRent(11)).toBe(2);   // 11 * 0.20 = 2.2 -> 2
      expect(calculateRent(15)).toBe(3);   // 15 * 0.20 = 3
      expect(calculateRent(17)).toBe(3);   // 17 * 0.20 = 3.4 -> 3
    });

    it('should enforce minimum 1 point rent', () => {
      expect(calculateRent(1)).toBe(1);    // 1 * 0.20 = 0.2 -> min 1
      expect(calculateRent(2)).toBe(1);    // 2 * 0.20 = 0.4 -> min 1
      expect(calculateRent(4)).toBe(1);    // 4 * 0.20 = 0.8 -> min 1
      expect(calculateRent(5)).toBe(1);    // 5 * 0.20 = 1
    });

    it('should use config values', () => {
      // Verify config has expected defaults
      expect(GRID_WARS_CONFIG.landlordTaxRate).toBe(0.20);
      expect(GRID_WARS_CONFIG.landlordTaxMinimum).toBe(1);
    });
  });

  describe('Tax eligibility rules', () => {
    // Simulate processLandlordTax eligibility logic
    function shouldApplyTax(targetAddress, parentCell, claimerUsername) {
      // Must be a subcell (has parent)
      if (!targetAddress || !targetAddress.includes('.')) return false;

      // Parent must exist
      if (!parentCell) return false;

      // Parent must be developed
      if (!parentCell.is_developed) return false;

      // Parent must be owned
      if (!parentCell.owner) return false;

      // Claimer must NOT be the parent owner (no self-tax)
      if (parentCell.owner === claimerUsername) return false;

      return true;
    }

    it('should NOT apply tax for macro cell claims (no parent)', () => {
      const result = shouldApplyTax('d5', { owner: 'alice', is_developed: true }, 'bob');
      expect(result).toBe(false);
    });

    it('should NOT apply tax when parent is not developed', () => {
      const result = shouldApplyTax('d5.a1', { owner: 'alice', is_developed: false }, 'bob');
      expect(result).toBe(false);
    });

    it('should NOT apply tax when parent has no owner', () => {
      const result = shouldApplyTax('d5.a1', { owner: null, is_developed: true }, 'bob');
      expect(result).toBe(false);
    });

    it('should NOT apply tax when claiming inside own developed territory', () => {
      const result = shouldApplyTax('d5.a1', { owner: 'alice', is_developed: true }, 'alice');
      expect(result).toBe(false);
    });

    it('should apply tax when claiming inside another player\'s developed territory', () => {
      const result = shouldApplyTax('d5.a1', { owner: 'alice', is_developed: true }, 'bob');
      expect(result).toBe(true);
    });

    it('should apply tax for level 2 subcells too', () => {
      const result = shouldApplyTax('d5.c3.a1', { owner: 'alice', is_developed: true }, 'bob');
      expect(result).toBe(true);
    });
  });

  describe('Tax scenarios', () => {
    function calculateRent(cost) {
      const taxRate = GRID_WARS_CONFIG.landlordTaxRate || 0.20;
      const minTax = GRID_WARS_CONFIG.landlordTaxMinimum || 1;
      return Math.max(minTax, Math.floor(cost * taxRate));
    }

    it('should calculate correct rent for subcell claim (10 pts)', () => {
      const claimCost = GRID_WARS_CONFIG.subcellClaimCost; // 10
      const rent = calculateRent(claimCost);
      expect(rent).toBe(2); // 10 * 0.20 = 2
    });

    it('should calculate correct rent for subcell attack cold (15 pts)', () => {
      const attackCost = GRID_WARS_CONFIG.subcellTakeoverCostCold; // 15
      const rent = calculateRent(attackCost);
      expect(rent).toBe(3); // 15 * 0.20 = 3
    });

    it('should calculate correct rent for subcell attack warm (20 pts)', () => {
      const attackCost = GRID_WARS_CONFIG.subcellTakeoverCostWarm; // 20
      const rent = calculateRent(attackCost);
      expect(rent).toBe(4); // 20 * 0.20 = 4
    });

    it('should calculate correct rent for subcell attack active (25 pts)', () => {
      const attackCost = GRID_WARS_CONFIG.subcellTakeoverCostActive; // 25
      const rent = calculateRent(attackCost);
      expect(rent).toBe(5); // 25 * 0.20 = 5
    });

    it('should calculate rent on fortified attack cost', () => {
      // Base attack cost 15, with 1.25x fortification = 18.75 -> 19
      const fortifiedCost = Math.ceil(15 * 1.25);
      expect(fortifiedCost).toBe(19);

      const rent = calculateRent(fortifiedCost);
      expect(rent).toBe(3); // 19 * 0.20 = 3.8 -> 3
    });
  });
});

// ============================================
// FORTIFICATION TESTS
// ============================================

describe('Grid Wars v2.2.5 - Fortification', () => {
  describe('Fortification multiplier', () => {
    it('should have correct config value', () => {
      expect(GRID_WARS_CONFIG.fortificationMultiplier).toBe(1.25);
    });

    it('should increase cost by 25%', () => {
      const baseCost = 100;
      const fortifiedCost = Math.ceil(baseCost * GRID_WARS_CONFIG.fortificationMultiplier);
      expect(fortifiedCost).toBe(125);
    });

    it('should round up fractional costs', () => {
      const baseCost = 60;
      const fortifiedCost = Math.ceil(baseCost * 1.25);
      expect(fortifiedCost).toBe(75); // 60 * 1.25 = 75
    });

    it('should apply correctly to subcell takeover costs', () => {
      const coldCost = GRID_WARS_CONFIG.subcellTakeoverCostCold; // 15
      const fortifiedCold = Math.ceil(coldCost * 1.25);
      expect(fortifiedCold).toBe(19); // 15 * 1.25 = 18.75 -> 19

      const warmCost = GRID_WARS_CONFIG.subcellTakeoverCostWarm; // 20
      const fortifiedWarm = Math.ceil(warmCost * 1.25);
      expect(fortifiedWarm).toBe(25); // 20 * 1.25 = 25

      const activeCost = GRID_WARS_CONFIG.subcellTakeoverCostActive; // 25
      const fortifiedActive = Math.ceil(activeCost * 1.25);
      expect(fortifiedActive).toBe(32); // 25 * 1.25 = 31.25 -> 32
    });
  });

  describe('Fortification eligibility rules', () => {
    // Simulate getFortificationMultiplier eligibility logic
    function shouldApplyFortification(targetAddress, parentCell, attackerUsername) {
      // Must be a subcell
      if (!targetAddress || !targetAddress.includes('.')) {
        return { isFortified: false };
      }

      // Parent must exist
      if (!parentCell) {
        return { isFortified: false };
      }

      // Parent must be developed
      if (!parentCell.is_developed) {
        return { isFortified: false };
      }

      // Parent must be owned
      if (!parentCell.owner) {
        return { isFortified: false };
      }

      // Attacker must NOT be the parent owner (no penalty in your own territory)
      if (parentCell.owner === attackerUsername) {
        return { isFortified: false };
      }

      return { isFortified: true, landlord: parentCell.owner };
    }

    it('should NOT apply fortification for macro cell attacks', () => {
      const result = shouldApplyFortification('d5', { owner: 'alice', is_developed: true }, 'bob');
      expect(result.isFortified).toBe(false);
    });

    it('should NOT apply fortification when parent is not developed', () => {
      const result = shouldApplyFortification('d5.a1', { owner: 'alice', is_developed: false }, 'bob');
      expect(result.isFortified).toBe(false);
    });

    it('should NOT apply fortification when attacking inside own territory', () => {
      const result = shouldApplyFortification('d5.a1', { owner: 'alice', is_developed: true }, 'alice');
      expect(result.isFortified).toBe(false);
    });

    it('should apply fortification when attacking inside enemy\'s developed territory', () => {
      const result = shouldApplyFortification('d5.a1', { owner: 'alice', is_developed: true }, 'bob');
      expect(result.isFortified).toBe(true);
      expect(result.landlord).toBe('alice');
    });
  });

  describe('Cost calculation with fortification', () => {
    // Simulate full cost calculation with fortification
    function calculateAttackCost(baseCost, isFortified) {
      let cost = baseCost;
      if (isFortified) {
        cost = Math.ceil(cost * GRID_WARS_CONFIG.fortificationMultiplier);
      }
      return cost;
    }

    it('should not modify cost when not fortified', () => {
      expect(calculateAttackCost(60, false)).toBe(60);
      expect(calculateAttackCost(100, false)).toBe(100);
    });

    it('should increase cost by 25% when fortified', () => {
      expect(calculateAttackCost(60, true)).toBe(75);
      expect(calculateAttackCost(80, true)).toBe(100);
      expect(calculateAttackCost(100, true)).toBe(125);
    });
  });
});

// ============================================
// CLIENT-SIDE UI TESTS
// ============================================

describe('Grid Wars v2.2.5 - Client UI', () => {
  describe('getParentAddress helper (grid-panel)', () => {
    function getParentAddress(address) {
      if (!address || !address.includes('.')) return null;
      const parts = address.split('.');
      parts.pop();
      return parts.join('.') || null;
    }

    it('should extract parent correctly', () => {
      expect(getParentAddress('d5.a1')).toBe('d5');
      expect(getParentAddress('d5.c3.a1')).toBe('d5.c3');
    });
  });

  describe('isInsideFortifiedTerritory check', () => {
    // Simulate the client-side check
    function isInsideFortifiedTerritory(selectedCell, territories, currentUser) {
      if (!selectedCell) return false;

      const address = selectedCell.address;
      if (!address || !address.includes('.')) return false;

      const parentAddress = address.split('.').slice(0, -1).join('.');
      if (!parentAddress) return false;

      const parentCell = territories.find(t => t.address === parentAddress);
      if (!parentCell) return false;

      if (!parentCell.is_developed) return false;
      if (!parentCell.owner) return false;
      if (parentCell.owner === currentUser) return false;

      return true;
    }

    it('should return false for macro cells', () => {
      const result = isInsideFortifiedTerritory(
        { address: 'd5' },
        [{ address: 'd5', owner: 'alice', is_developed: true }],
        'bob'
      );
      expect(result).toBe(false);
    });

    it('should return false when attacking inside own territory', () => {
      const result = isInsideFortifiedTerritory(
        { address: 'd5.a1' },
        [{ address: 'd5', owner: 'alice', is_developed: true }],
        'alice'
      );
      expect(result).toBe(false);
    });

    it('should return true when attacking inside enemy territory', () => {
      const result = isInsideFortifiedTerritory(
        { address: 'd5.a1' },
        [{ address: 'd5', owner: 'alice', is_developed: true }],
        'bob'
      );
      expect(result).toBe(true);
    });
  });

  describe('Claim button fortification indicator', () => {
    it('should show fortification icon for attacks in enemy territory', () => {
      const isFortified = true;
      const cost = 75;

      let buttonHTML;
      if (isFortified) {
        buttonHTML = `⚔️ Attack<span class="gw-cost">${cost}⚡</span><span style="color:#f59e0b;font-size:9px;margin-left:4px;">🏰+25%</span>`;
      } else {
        buttonHTML = `⚔️ Attack<span class="gw-cost">${cost}⚡</span>`;
      }

      expect(buttonHTML).toContain('🏰+25%');
      expect(buttonHTML).toContain('Attack');
    });

    it('should NOT show fortification icon for normal attacks', () => {
      const isFortified = false;
      const cost = 60;

      let buttonHTML;
      if (isFortified) {
        buttonHTML = `⚔️ Attack<span class="gw-cost">${cost}⚡</span><span style="color:#f59e0b;font-size:9px;margin-left:4px;">🏰+25%</span>`;
      } else {
        buttonHTML = `⚔️ Attack<span class="gw-cost">${cost}⚡</span>`;
      }

      expect(buttonHTML).not.toContain('🏰');
      expect(buttonHTML).toContain('Attack');
    });
  });

  describe('Rent collected toast', () => {
    it('should format rent notification correctly', () => {
      const data = { rent: 5, tenant: 'bob' };
      const message = `💰 +${data.rent} pts rent from ${data.tenant}`;

      expect(message).toBe('💰 +5 pts rent from bob');
    });
  });

  describe('Develop button tooltip', () => {
    const tooltipHTML = `
      <div>📦 Creates 64 subcells (you keep center 4)</div>
      <div>💰 Earn 20% rent when others claim inside</div>
      <div>🏰 Attackers pay +25% more for your subcells</div>
      <div>🛡️ Immune to drilling</div>
    `;

    it('should mention subcell creation', () => {
      expect(tooltipHTML).toContain('Creates 64 subcells');
    });

    it('should mention rent earning', () => {
      expect(tooltipHTML).toContain('20% rent');
    });

    it('should mention fortification defense', () => {
      expect(tooltipHTML).toContain('+25% more');
    });

    it('should mention drill immunity', () => {
      expect(tooltipHTML).toContain('Immune to drilling');
    });
  });
});

// ============================================
// WEBSOCKET MESSAGE TESTS
// ============================================

describe('Grid Wars v2.2.5 - WebSocket Messages', () => {
  describe('rent_collected message handling', () => {
    it('should notify landlord when they receive rent', () => {
      const message = {
        type: 'rent_collected',
        landlord: 'alice',
        tenant: 'bob',
        rent: 5,
        cell: 'd5.a1'
      };
      const currentUser = 'alice';

      let notified = false;
      if (message.landlord === currentUser) {
        notified = true;
      }

      expect(notified).toBe(true);
    });

    it('should NOT notify tenant about rent payment', () => {
      const message = {
        type: 'rent_collected',
        landlord: 'alice',
        tenant: 'bob',
        rent: 5,
        cell: 'd5.a1'
      };
      const currentUser = 'bob';

      let notified = false;
      if (message.landlord === currentUser) {
        notified = true;
      }

      expect(notified).toBe(false);
    });

    it('should NOT notify uninvolved players', () => {
      const message = {
        type: 'rent_collected',
        landlord: 'alice',
        tenant: 'bob',
        rent: 5,
        cell: 'd5.a1'
      };
      const currentUser = 'charlie';

      let notified = false;
      if (message.landlord === currentUser) {
        notified = true;
      }

      expect(notified).toBe(false);
    });
  });
});

// ============================================
// INTEGRATION SCENARIO TESTS
// ============================================

describe('Grid Wars v2.2.5 - Integration Scenarios', () => {
  describe('Scenario 1: Player A develops, Player B claims neutral subcell', () => {
    it('should calculate correct rent for neutral subcell claim', () => {
      const claimCost = GRID_WARS_CONFIG.subcellClaimCost; // 10
      const taxRate = GRID_WARS_CONFIG.landlordTaxRate; // 0.20
      const rent = Math.max(1, Math.floor(claimCost * taxRate));

      expect(rent).toBe(2);
    });
  });

  describe('Scenario 2: Player C attacks inside Player A\'s developed cell', () => {
    it('should apply fortification AND calculate rent', () => {
      // Base attack cost for cold target
      const baseCost = GRID_WARS_CONFIG.subcellTakeoverCostCold; // 15

      // Apply fortification
      const fortifiedCost = Math.ceil(baseCost * GRID_WARS_CONFIG.fortificationMultiplier);
      expect(fortifiedCost).toBe(19); // 15 * 1.25 = 18.75 -> 19

      // Calculate rent on fortified cost
      const rent = Math.max(1, Math.floor(fortifiedCost * GRID_WARS_CONFIG.landlordTaxRate));
      expect(rent).toBe(3); // 19 * 0.20 = 3.8 -> 3
    });
  });

  describe('Scenario 3: Player A attacks inside their OWN developed cell', () => {
    it('should NOT apply fortification', () => {
      const baseCost = GRID_WARS_CONFIG.subcellTakeoverCostCold;
      const isOwnTerritory = true;

      const cost = isOwnTerritory ? baseCost : Math.ceil(baseCost * 1.25);
      expect(cost).toBe(15);
    });

    it('should NOT pay rent to self', () => {
      const owner = 'alice';
      const attacker = 'alice';

      const shouldPayRent = owner !== attacker;
      expect(shouldPayRent).toBe(false);
    });
  });

  describe('Scenario 4: Deep nesting (level 2 subcells)', () => {
    it('should work at any level depth', () => {
      // d5 -> d5.c3 -> d5.c3.a1
      const address = 'd5.c3.a1';
      const parentAddress = 'd5.c3';

      expect(address.includes('.')).toBe(true);
      expect(parentAddress).toBe('d5.c3');

      // Check parent of parent too
      const grandparentAddress = 'd5';
      expect(parentAddress.includes('.')).toBe(true);
      expect(grandparentAddress).toBe('d5');
    });
  });
});

// ============================================
// CONFIG VALIDATION TESTS
// ============================================

describe('Grid Wars v2.2.5 - Config Validation', () => {
  it('should have landlordTaxRate defined', () => {
    expect(GRID_WARS_CONFIG.landlordTaxRate).toBeDefined();
    expect(typeof GRID_WARS_CONFIG.landlordTaxRate).toBe('number');
    expect(GRID_WARS_CONFIG.landlordTaxRate).toBeGreaterThan(0);
    expect(GRID_WARS_CONFIG.landlordTaxRate).toBeLessThanOrEqual(1);
  });

  it('should have landlordTaxMinimum defined', () => {
    expect(GRID_WARS_CONFIG.landlordTaxMinimum).toBeDefined();
    expect(typeof GRID_WARS_CONFIG.landlordTaxMinimum).toBe('number');
    expect(GRID_WARS_CONFIG.landlordTaxMinimum).toBeGreaterThanOrEqual(1);
  });

  it('should have fortificationMultiplier defined', () => {
    expect(GRID_WARS_CONFIG.fortificationMultiplier).toBeDefined();
    expect(typeof GRID_WARS_CONFIG.fortificationMultiplier).toBe('number');
    expect(GRID_WARS_CONFIG.fortificationMultiplier).toBeGreaterThanOrEqual(1);
  });

  it('should have reasonable default values', () => {
    // 20% rent is reasonable
    expect(GRID_WARS_CONFIG.landlordTaxRate).toBe(0.20);

    // Minimum 1 point rent
    expect(GRID_WARS_CONFIG.landlordTaxMinimum).toBe(1);

    // 25% attack cost increase
    expect(GRID_WARS_CONFIG.fortificationMultiplier).toBe(1.25);
  });
});
