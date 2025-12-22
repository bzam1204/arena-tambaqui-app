type MatchChecklistHeaderProps = {
  name: string;
  dateLabel: string;
  timeLabel: string;
};

export function MatchChecklistHeader({ name, dateLabel, timeLabel }: MatchChecklistHeaderProps) {
  return (
    <div className="space-y-2">
      <div
        className="text-lg sm:text-xl font-mono-technical tracking-wider uppercase text-[#E6F1FF] glitch-text"
        data-text={`// CHECKLIST OPERACIONAL: ${name}`}
      >
        // CHECKLIST OPERACIONAL: {name}
      </div>
      <div className="text-xs text-[#7F94B0] font-mono-technical">
        DATA: {dateLabel} // HORA: {timeLabel}
      </div>
    </div>
  );
}
