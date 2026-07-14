import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(join(process.cwd(), 'src/styles.scss'), 'utf8');

describe('dark theme styles', () => {
  it('covers shared surface, text, status, and interaction utilities used across screens', () => {
    const requiredSelectors = [
      '.dark-theme .bg-white',
      '.dark-theme .bg-gray-50',
      '.dark-theme .bg-indigo-50',
      '.dark-theme .bg-blue-100',
      '.dark-theme .bg-green-100',
      '.dark-theme .bg-amber-50',
      '.dark-theme .bg-rose-50',
      '.dark-theme .text-indigo-600',
      '.dark-theme .text-blue-700',
      '.dark-theme .text-green-700',
      '.dark-theme .text-red-700',
      '.dark-theme .hover\\:bg-indigo-100:hover',
      '.dark-theme .shadow-2xl',
    ];

    for (const selector of requiredSelectors) {
      expect(styles).toContain(selector);
    }
  });
});
