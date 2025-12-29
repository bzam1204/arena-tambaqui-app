import { useEffect, useState } from 'react';
import type { MatchPaymentBreakdown } from '@/domain/payment';
import { formatCurrency } from '@/domain/payment';
import { createPixPayload, createPixQrCode } from '@/domain/pix';
import { TacticalButton } from '@/components/TacticalButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type PixPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchName: string;
  transactionId: string;
  message?: string;
  pricing: MatchPaymentBreakdown;
  onConfirm: () => void;
  isPending?: boolean;
  errorMessage?: string | null;
};

export function PixPaymentDialog({
  open,
  onOpenChange,
  matchName,
  transactionId,
  message,
  pricing,
  onConfirm,
  isPending,
  errorMessage,
}: PixPaymentDialogProps) {
  const { subscriptionCents, rentCents, discountCents, totalCents, benefits } = pricing;
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [payload, setPayload] = useState('');
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const description = message ?? `Pagamento ${matchName}`;
    const nextPayload = createPixPayload({
      transactionId,
      message: description,
      valueCents: totalCents,
    });

    setPayload(nextPayload);
    setQrImage(null);
    setQrError(null);

    createPixQrCode(nextPayload)
      .then((dataUrl) => setQrImage(dataUrl))
      .catch(() => setQrError('Falha ao gerar QR.'));
  }, [matchName, message, open, totalCents, transactionId]);

  const handleCopyCode = async () => {
    try {
      if (!payload) return;
      await navigator.clipboard.writeText(payload);
      setCopyMessage('Codigo copiado.');
      window.setTimeout(() => setCopyMessage(null), 2000);
    } catch {
      setCopyMessage('Nao foi possivel copiar.');
      window.setTimeout(() => setCopyMessage(null), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0B0E14] border border-[#2D3A52] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#E6F1FF] font-mono-technical uppercase">[ Pagamento PIX ]</DialogTitle>
          <DialogDescription className="text-[#7F94B0]">
            Escaneie o QR ou copie o codigo para concluir.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[180px,1fr]">
          <div className="rounded-lg border border-[#2D3A52] bg-[#0F1729] p-3 flex flex-col items-center gap-3">
            <div className="bg-[#F8FAFC] rounded-md p-2 shadow-[0_0_20px_rgba(0,240,255,0.18)]">
              {qrImage ? (
                <img
                  src={qrImage}
                  alt="QR code do PIX"
                  className="w-full max-w-[220px] sm:max-w-[260px] aspect-square object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-[220px] w-[220px] items-center justify-center border border-[#E6F1FF]/10 bg-white/70 text-[10px] text-[#0B0E14] font-mono-technical uppercase">
                  {qrError ?? 'Gerando QR...'}
                </div>
              )}
            </div>
            <div className="text-[10px] text-[#7F94B0] font-mono-technical uppercase">
              Escaneie o QR
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-[#141A26] border border-[#2D3A52] rounded-lg p-3 space-y-1">
              <div className="text-[10px] text-[#7F94B0] font-mono-technical uppercase">Partida</div>
              <div className="text-sm text-[#E6F1FF] uppercase">{matchName}</div>
            </div>
            <div className="bg-[#0F1729] border border-[#2D3A52] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#7F94B0] font-mono-technical uppercase">
                <span>Inscricao</span>
                <span>{formatCurrency(subscriptionCents)}</span>
              </div>
              {rentCents > 0 ? (
                <div className="flex items-center justify-between text-xs text-[#7F94B0] font-mono-technical uppercase">
                  <span>Aluguel de equipamento</span>
                  <span>{formatCurrency(rentCents)}</span>
                </div>
              ) : null}
              {discountCents > 0 ? (
                <div className="flex items-center justify-between text-xs text-[#2EEB77] font-mono-technical uppercase">
                  <span>Desconto VIP</span>
                  <span>-{formatCurrency(discountCents)}</span>
                </div>
              ) : null}
              <div className="h-px bg-[#2D3A52]" />
              <div className="flex items-center justify-between text-sm text-[#E6F1FF] font-mono-technical uppercase">
                <span>Total</span>
                <span className="text-[#00F0FF]">{formatCurrency(totalCents)}</span>
              </div>
            </div>
            {benefits.length > 0 ? (
              <div className="bg-[#0F1E2B] border border-[#00F0FF] text-[#00F0FF] text-[10px] font-mono-technical uppercase rounded-lg p-3 space-y-1">
                {benefits.map((benefit) => (
                  <div key={benefit}>{benefit}</div>
                ))}
              </div>
            ) : null}
            <div className="bg-[#101B2B] border border-[#2D3A52] rounded-lg p-3 space-y-2">
              <div className="text-[10px] text-[#7F94B0] font-mono-technical uppercase">
                Codigo PIX
              </div>
              <div className="space-y-2">
                <div className="text-xs text-[#E6F1FF] font-mono-technical break-all">{payload}</div>
                <div className="flex justify-end">
                  <TacticalButton
                    variant="cyan"
                    className="px-3! py-2! text-[10px]"
                    onClick={handleCopyCode}
                    disabled={!payload}
                  >
                    Copiar codigo
                  </TacticalButton>
                </div>
              </div>
              {copyMessage ? (
                <div className="text-[10px] text-[#00F0FF] font-mono-technical uppercase">{copyMessage}</div>
              ) : null}
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="text-xs text-[#FF6B00] font-mono-technical">{errorMessage}</div>
        ) : null}

        <DialogFooter>
          <TacticalButton variant="cyan" onClick={() => onOpenChange(false)}>
            Cancelar
          </TacticalButton>
          <TacticalButton
            variant="amber"
            onClick={onConfirm}
            disabled={isPending}
            leftIcon={
              isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent border-l-transparent rounded-full animate-spin" />
              ) : undefined
            }
          >
            {isPending ? '[ PROCESSANDO... ]' : '[ FIZ O PAGAMENTO ]'}
          </TacticalButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
