/**
 * Code quality tests for railway-server
 * Prevents regressions like duplicate function declarations
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SERVER_PATH = path.join(process.cwd(), 'railway-server', 'server.js');
const ADDRESS_UTILS_PATH = path.join(process.cwd(), 'railway-server', 'address-utils.js');

describe('Server Code Quality', () => {
  describe('No duplicate function declarations', () => {
    it('should not have functions declared that are already imported from address-utils', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      const addressUtilsCode = fs.readFileSync(ADDRESS_UTILS_PATH, 'utf-8');

      // Extract exported function names from address-utils.js
      const exportMatch = addressUtilsCode.match(/module\.exports\s*=\s*\{([^}]+)\}/);
      expect(exportMatch).toBeTruthy();

      const exportedFunctions = exportMatch[1]
        .split(',')
        .map(name => name.trim())
        .filter(name => name && !name.includes(':'));

      // Check that none of these functions are redeclared in server.js
      const duplicates = [];
      for (const funcName of exportedFunctions) {
        // Look for function declarations (not imports or calls)
        const declarationPattern = new RegExp(`^\\s*function\\s+${funcName}\\s*\\(`, 'm');
        const arrowPattern = new RegExp(`^\\s*const\\s+${funcName}\\s*=\\s*\\([^)]*\\)\\s*=>`, 'm');

        if (declarationPattern.test(serverCode) || arrowPattern.test(serverCode)) {
          duplicates.push(funcName);
        }
      }

      expect(duplicates, `Found duplicate declarations for imported functions: ${duplicates.join(', ')}`).toEqual([]);
    });

    it('should import getParentAddress from address-utils (v2.2.5 regression)', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');

      // Verify address-utils.js is required
      expect(serverCode).toContain("require('./address-utils.js')");

      // Verify getParentAddress is in the import destructuring at top of file
      const importSection = serverCode.slice(0, 2000);
      expect(importSection).toContain('getParentAddress');
    });

    it('should not have duplicate function getParentAddress declaration', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');

      // Count occurrences of "function getParentAddress"
      const matches = serverCode.match(/function\s+getParentAddress\s*\(/g);

      expect(matches, 'getParentAddress should not be declared in server.js (it is imported from address-utils.js)').toBeNull();
    });
  });

  describe('Required imports are present', () => {
    it('should import all needed functions from address-utils', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');

      const requiredImports = [
        'coordsToAddress',
        'addressToCoords',
        'buildAddress',
        'getParentAddress',
        'getLevel',
        'getBreadcrumb'
      ];

      for (const funcName of requiredImports) {
        expect(serverCode, `Missing import: ${funcName}`).toContain(funcName);
      }
    });
  });
});
