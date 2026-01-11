/**
 * Grid Wars v2.0: Address Utilities (CommonJS)
 *
 * Chess-notation addressing system for hierarchical territories.
 * Addresses use format: "d5" (level 0), "d5.c3" (level 1), "d5.c3.a1" (level 2)
 *
 * Coordinate system (0-indexed):
 *   - x: 0-7 maps to columns a-h
 *   - y: 0-7 maps to rows 1-8
 */

/**
 * Convert x,y coordinates to chess notation
 * @param {number} x - Column (0-7)
 * @param {number} y - Row (0-7)
 * @returns {string} Chess notation like "d5"
 */
function coordsToAddress(x, y) {
  const col = String.fromCharCode(97 + x);  // 0='a', 7='h'
  const row = y + 1;                         // 0='1', 7='8'
  return `${col}${row}`;
}

/**
 * Convert chess notation to x,y coordinates
 * Handles compound addresses like "d5.c3.a1" by extracting the leaf
 * @param {string} address - Chess notation (simple or compound)
 * @returns {{x: number, y: number}} Coordinates
 */
function addressToCoords(address) {
  const parts = address.split('.');
  const leaf = parts[parts.length - 1];
  return {
    x: leaf.charCodeAt(0) - 97,   // 'a'=0, 'h'=7
    y: parseInt(leaf[1]) - 1       // '1'=0, '8'=7
  };
}

/**
 * Build full address from parent address and local coordinates
 * @param {string|null} parentAddress - Parent cell address (null for root)
 * @param {number} x - Local x coordinate (0-7)
 * @param {number} y - Local y coordinate (0-7)
 * @returns {string} Full address
 */
function buildAddress(parentAddress, x, y) {
  const local = coordsToAddress(x, y);
  return parentAddress ? `${parentAddress}.${local}` : local;
}

/**
 * Get parent address from a compound address
 * @param {string} address - Cell address
 * @returns {string|null} Parent address, or null for level 0
 */
function getParentAddress(address) {
  const parts = address.split('.');
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join('.');
}

/**
 * Get cell level from address (0 = macro, 1 = first subdivision, etc.)
 * @param {string} address - Cell address
 * @returns {number} Level (0-based)
 */
function getLevel(address) {
  if (!address) return 0;
  return address.split('.').length - 1;
}

/**
 * Get breadcrumb trail from address
 * @param {string|null} address - Cell address
 * @returns {string[]} Array of address parts
 */
function getBreadcrumb(address) {
  if (!address) return [];
  return address.split('.');
}

/**
 * Parse address into components
 * @param {string} address - Cell address
 * @returns {{parts: string[], level: number, parentAddress: string|null, localNotation: string}}
 */
function parseAddress(address) {
  const parts = address.split('.');
  return {
    parts,
    level: parts.length - 1,
    parentAddress: parts.length > 1 ? parts.slice(0, -1).join('.') : null,
    localNotation: parts[parts.length - 1]
  };
}

/**
 * Check if an address is a descendant of another
 * @param {string} childAddress - Potential child address
 * @param {string} parentAddress - Potential parent address
 * @returns {boolean} True if childAddress is inside parentAddress
 */
function isDescendantOf(childAddress, parentAddress) {
  if (!parentAddress) return true;  // Everything is under root
  return childAddress.startsWith(parentAddress + '.');
}

/**
 * Get all ancestor addresses (parent, grandparent, etc.)
 * @param {string} address - Cell address
 * @returns {string[]} Array of ancestor addresses, from immediate parent to root
 */
function getAncestors(address) {
  const ancestors = [];
  let current = getParentAddress(address);
  while (current) {
    ancestors.push(current);
    current = getParentAddress(current);
  }
  return ancestors;
}

/**
 * Center 4 cells (retained by owner on develop): d4, d5, e4, e5
 * These are x=3,4 and y=3,4 (0-indexed)
 */
const CENTER_CELLS = ['d4', 'd5', 'e4', 'e5'];

/**
 * Check if a local address is one of the center 4 cells
 * @param {string} localAddress - Local notation (e.g., "d4")
 * @returns {boolean} True if center cell
 */
function isCenterCell(localAddress) {
  return CENTER_CELLS.includes(localAddress);
}

/**
 * Attacker drill cell: a1 (corner)
 * This is x=0, y=0
 */
const DRILL_CELL = 'a1';

module.exports = {
  coordsToAddress,
  addressToCoords,
  buildAddress,
  getParentAddress,
  getLevel,
  getBreadcrumb,
  parseAddress,
  isDescendantOf,
  getAncestors,
  CENTER_CELLS,
  isCenterCell,
  DRILL_CELL
};
