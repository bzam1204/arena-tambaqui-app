import { PixBR } from 'pixbrasil';
import * as QRCode from 'qrcode';

export const PIX_KEY = '7e6a414c-3da0-4f70-b96d-58ca3370fa20';
export const PIX_MERCHANT_NAME = 'ARENA TAMBAQUI';
export const PIX_MERCHANT_CITY = 'MANAUS';

export function normalizeTransactionId(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25);
  return cleaned || 'ARENATAMBAQUI0001';
}

export function createPixPayload(input: { transactionId: string; message: string; valueCents: number }): string {
  const value = input.valueCents > 0 ? Number((input.valueCents / 100).toFixed(2)) : undefined;
  const pix = PixBR({
    key: PIX_KEY,
    name: PIX_MERCHANT_NAME,
    city: PIX_MERCHANT_CITY,
    transactionId: normalizeTransactionId(input.transactionId),
    message: input.message,
    ...(value ? { amount: value } : {}),
  });

  return pix;
}

export async function createPixQrCode(payload: string) {
  return QRCode.toDataURL(payload, { margin: 1, width: 320 });
}
