export function uniqueId(prefix = ''): string {
  return [prefix || '', Date.now().toString(36)].join('_');
}