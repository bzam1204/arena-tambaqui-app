const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export type MatchPaymentInput = {
  isVip: boolean;
  rentEquipment: boolean;
};

export type MatchPaymentBreakdown = {
  subscriptionCents: number;
  rentCents: number;
  discountCents: number;
  totalCents: number;
  benefits: string[];
};

export class MatchPaymentCalculator {
  static readonly SUBSCRIPTION_CENTS = 2000;
  static readonly RENT_CENTS = 5000;
  static readonly VIP_RENT_DISCOUNT_RATE = 0.3;

  calculate(input: MatchPaymentInput): MatchPaymentBreakdown {
    const benefits: string[] = [];
    const subscriptionCents = input.rentEquipment
      ? 0
      : input.isVip
        ? 0
        : MatchPaymentCalculator.SUBSCRIPTION_CENTS;
    const rentCents = input.rentEquipment ? MatchPaymentCalculator.RENT_CENTS : 0;
    const discountCents =
      input.isVip && input.rentEquipment
        ? Math.round(MatchPaymentCalculator.RENT_CENTS * MatchPaymentCalculator.VIP_RENT_DISCOUNT_RATE)
        : 0;
    const totalCents = subscriptionCents + rentCents - discountCents;

    if (input.isVip) {
      benefits.push('VIP: inscrição gratuita.');
      if (input.rentEquipment) {
        benefits.push('VIP: 30% de desconto no aluguel.');
      }
    }

    return {
      subscriptionCents,
      rentCents,
      discountCents,
      totalCents,
      benefits,
    };
  }
}

export function formatCurrency(valueCents: number) {
  return currencyFormatter.format(valueCents / 100);
}
