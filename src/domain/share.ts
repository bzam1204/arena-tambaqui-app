type MatchShareInput = {
  matchName: string;
  dateLabel: string;
  timeLabel: string;
  matchLink: string;
};

export function buildMatchShareText(input: MatchShareInput) {
  return [
    `Partida: ${input.matchName}`,
    `Data: ${input.dateLabel}`,
    `Hora: ${input.timeLabel}`,
    `Link: ${input.matchLink}`,
    'Arena Tambaqui',
  ].join('\n');
}
