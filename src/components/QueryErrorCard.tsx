import type { ReactNode } from 'react';

type Props = {
  title?: string;
  message?: string;
  action?: ReactNode;
};

export function QueryErrorCard({
  title = 'Falha ao carregar',
  message = 'Não foi possível obter as informações. Tente novamente.',
  action,
}: Props) {
  return (
    <div className="w-full max-w-xl mx-auto bg-[#141A26] border border-[#FF6B00]/40 rounded-lg p-4 text-center text-[#E6F1FF]">
      <p className="text-xs uppercase font-mono-technical tracking-wide text-[#FF6B00] mb-2">{title}</p>
      <p className="text-sm text-[#7F94B0] mb-3">{message}</p>
      {action ? <div className="flex justify-center">{action}</div> : null}
    </div>
  );
}

