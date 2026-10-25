import { describe, expect, it } from 'vitest';

import { toCsv } from './csv';

describe('toCsv', () => {
  it('writes a header row and CRLF line endings', () => {
    expect(toCsv(['a', 'b'], [['1', '2']])).toBe('a,b\r\n1,2\r\n');
  });

  it('quotes values that contain a comma, a quote or a newline', () => {
    expect(toCsv(['note'], [['Dharan, Nepal']])).toBe('note\r\n"Dharan, Nepal"\r\n');
    expect(toCsv(['note'], [['He said "hi"']])).toBe('note\r\n"He said ""hi"""\r\n');
    expect(toCsv(['note'], [['two\nlines']])).toBe('note\r\n"two\nlines"\r\n');
  });

  it('defuses values a spreadsheet would treat as a formula', () => {
    expect(toCsv(['name'], [['=1+1']])).toBe("name\r\n'=1+1\r\n");
    expect(toCsv(['name'], [['@SUM(A1)']])).toBe("name\r\n'@SUM(A1)\r\n");
    expect(toCsv(['name'], [['-5']])).toBe("name\r\n'-5\r\n");
  });

  it('leaves ordinary values untouched', () => {
    expect(toCsv(['n'], [['Sagar Shrestha']])).toBe('n\r\nSagar Shrestha\r\n');
  });
});
