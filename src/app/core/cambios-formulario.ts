export type SnapshotFormulario = Record<string, string | number | boolean | null | undefined>;

export function normalizarSnapshot(
  value: SnapshotFormulario,
  lowerCaseKeys: readonly string[] = []
): Record<string, string | number | boolean | null> {
  const lowerKeys = new Set(lowerCaseKeys);

  return Object.fromEntries(
    Object.entries(value).map(([key, raw]) => {
      if (typeof raw !== 'string') return [key, raw ?? null];

      const normalized = raw.trim().replace(/\s+/g, ' ');
      if (!normalized) return [key, null];
      return [key, lowerKeys.has(key) ? normalized.toLowerCase() : normalized];
    })
  );
}

export function hayCambios(
  original: Record<string, string | number | boolean | null>,
  actual: Record<string, string | number | boolean | null>
): boolean {
  const keys = new Set([...Object.keys(original), ...Object.keys(actual)]);
  return [...keys].some((key) => original[key] !== actual[key]);
}
