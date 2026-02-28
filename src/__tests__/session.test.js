import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { validatePath } from '../session.js';

describe('validatePath', () => {
  it('allows paths under cwd', () => {
    const cwd = path.resolve('/tmp/project');
    const p = path.join(cwd, 'a', 'b.txt');
    const res = validatePath(p, cwd, false);
    expect(res.valid).toBe(true);
    expect(res.resolved).toBe(path.resolve(p));
  });

  it('blocks paths outside cwd when allowOutsideCwd=false', () => {
    const cwd = path.resolve('/tmp/project');
    const p = path.resolve('/tmp/other/secrets.txt');
    const res = validatePath(p, cwd, false);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/outside the allowed working directory/i);
  });

  it('allows paths outside cwd when allowOutsideCwd=true', () => {
    const cwd = path.resolve('/tmp/project');
    const p = path.resolve('/tmp/other/secrets.txt');
    const res = validatePath(p, cwd, true);
    expect(res.valid).toBe(true);
    expect(res.resolved).toBe(path.resolve(p));
  });
});
