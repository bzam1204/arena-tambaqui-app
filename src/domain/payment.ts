const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export type MatchPaymentInput = {
  isVip: boolean;
  rentEquipment: boolean;
  guests?: MatchGuestPaymentInput[];
  includePlayer?: boolean;
};

export type MatchGuestPaymentInput = {
  id?: string;
  name: string;
  rentEquipment: boolean;
};

export type MatchGuestPaymentBreakdown = {
  id: string;
  name: string;
  rentEquipment: boolean;
  totalCents: number;
};

export type MatchPaymentBreakdown = {
  subscriptionCents: number;
  rentCents: number;
  discountCents: number;
  guestTotalCents: number;
  totalCents: number;
  benefits: string[];
  guestItems: MatchGuestPaymentBreakdown[];
  includePlayer: boolean;
};

export class MatchPaymentCalculator {
  static readonly SUBSCRIPTION_CENTS = 2000;
  static readonly RENT_CENTS = 5000;
  static readonly VIP_RENT_DISCOUNT_RATE = 0.3;

  calculate(input: MatchPaymentInput): MatchPaymentBreakdown {
    const includePlayer = input.includePlayer ?? true;
    const benefits: string[] = [];
    const subscriptionCents = includePlayer
      ? input.rentEquipment
        ? 0
        : input.isVip
          ? 0
          : MatchPaymentCalculator.SUBSCRIPTION_CENTS
      : 0;
    const rentCents = includePlayer && input.rentEquipment ? MatchPaymentCalculator.RENT_CENTS : 0;
    const discountCents =
      includePlayer && input.isVip && input.rentEquipment
        ? Math.round(MatchPaymentCalculator.RENT_CENTS * MatchPaymentCalculator.VIP_RENT_DISCOUNT_RATE)
        : 0;

    const guestItems = (input.guests ?? []).map((guest, index) => {
      const totalCents = guest.rentEquipment
        ? MatchPaymentCalculator.RENT_CENTS
        : MatchPaymentCalculator.SUBSCRIPTION_CENTS;
      return {
        id: guest.id ?? `guest-${index}`,
        name: guest.name,
        rentEquipment: guest.rentEquipment,
        totalCents,
      } satisfies MatchGuestPaymentBreakdown;
    });
    const guestTotalCents = guestItems.reduce((total, guest) => total + guest.totalCents, 0);

    const totalCents = subscriptionCents + rentCents - discountCents + guestTotalCents;

    if (includePlayer && input.isVip) {
      benefits.push('VIP: inscrição gratuita.');
      if (input.rentEquipment) {
        benefits.push('VIP: 30% de desconto no aluguel.');
      }
    }

    return {
      subscriptionCents,
      rentCents,
      discountCents,
      guestTotalCents,
      totalCents,
      benefits,
      guestItems,
      includePlayer,
    };
  }
}

export function formatCurrency(valueCents: number) {
  return currencyFormatter.format(valueCents / 100);
}
