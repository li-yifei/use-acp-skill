import { describe, it, expect } from 'vitest';
import { stripMarkdown, parseVerification, escapeRegex } from '../verified-prompt.js';

describe('verified-prompt helpers', () => {
  it('stripMarkdown removes common formatting', () => {
    const input = 'Here is `code` and **bold** and ```\nblock\n```';
    const out = stripMarkdown(input);
    expect(out).toContain('code');
    expect(out).toContain('bold');
    expect(out).not.toMatch(/```/);
  });

  it('parseVerification classifies verified/missing per-file lines', () => {
    const expected = ['src/a.js', 'src/b.js'];
    const text = [
      'EXISTS: src/a.js',
      'MISSING: src/b.js',
    ].join('\n');

    const res = parseVerification(text, expected);
    expect(res.verified).toEqual(['src/a.js']);
    expect(res.missing).toEqual(['src/b.js']);
  });

  it('escapeRegex escapes special chars', () => {
    expect(new RegExp(escapeRegex('a.b')).test('a.b')).toBe(true);
  });
});
