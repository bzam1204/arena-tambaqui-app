export function format(date: Date, mode: 'date' | 'time'): string {
  if (mode === 'date') {
    return date
      .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
      .replace(/\//g, '.');
  }
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
