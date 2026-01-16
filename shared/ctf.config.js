/**
 * Linear CTF (Capture The Flag) Configuration
 *
 * A simple tug-of-war game where two teams compete to push the
 * front line toward the enemy flag by earning points through drilling.
 */

export const CTF_CONFIG = {
  // Lane configuration
  laneLength: 21,           // Positions 0-20
  startPosition: 10,        // Front line starts at center
  blueFlag: 0,              // Blue flag at position 0
  redFlag: 20,              // Red flag at position 20

  // Points required to move front line 1 position
  pointsPerMove: 20,

  // Star point values (same as weighted scoring, simplified)
  starPoints: {
    gold: 4,
    silver: 3,
    bronze: 2,
    tin: 1
  },

  // Canvas rendering
  cellWidth: 40,
  cellHeight: 60,
  padding: 20,

  // Colors
  colors: {
    blue: '#3b82f6',        // Tailwind blue-500
    red: '#ef4444',         // Tailwind red-500
    blueDark: '#1d4ed8',    // Tailwind blue-700
    redDark: '#b91c1c',     // Tailwind red-700
    neutral: '#6b7280',     // Tailwind gray-500
    frontLine: '#fbbf24',   // Tailwind amber-400
    background: '#1f2937',  // Tailwind gray-800
    text: '#f9fafb'         // Tailwind gray-50
  }
};

// CommonJS export for server
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CTF_CONFIG };
}
