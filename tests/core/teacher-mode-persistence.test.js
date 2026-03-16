import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const appHtmlPath = join(process.cwd(), 'platform', 'app.html');
const appHtmlContent = readFileSync(appHtmlPath, 'utf-8');

function extractFunctionBody(source, functionSignature) {
  const startIndex = source.indexOf(functionSignature);
  if (startIndex === -1) return null;

  let braceIndex = source.indexOf('{', startIndex);
  if (braceIndex === -1) return null;

  let depth = 1;
  let i = braceIndex + 1;
  while (i < source.length && depth > 0) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') depth--;
    i++;
  }

  return source.slice(braceIndex + 1, i - 1);
}

describe('Teacher mode persistence regression', () => {
  it('imports the shared network config module', () => {
    expect(appHtmlContent).toContain("import { DEFAULT_SERVER_URL, detectNetworkConfig } from './core/network-config.js';");
  });

  it('does not downgrade the API URL to insecure same-host HTTP', () => {
    expect(appHtmlContent).not.toContain('SERVER_URL = `http://${window.location.host}`;');
    expect(appHtmlContent).not.toContain("SIGNALING_URL = `ws://${window.location.host}/ws-signaling`;");
  });

  it('restores teacher mode from cache before background revalidation', () => {
    const body = extractFunctionBody(appHtmlContent, 'async function checkTeacherModePersistence()');
    expect(body).toBeTruthy();

    const activateIndex = body.indexOf('await activateTeacherMode(savedTeacher.password, false);');
    const validateIndex = body.indexOf('validateTeacherPassword(savedTeacher.password)');

    expect(activateIndex).toBeGreaterThan(-1);
    expect(validateIndex).toBeGreaterThan(-1);
    expect(activateIndex).toBeLessThan(validateIndex);
  });
});
