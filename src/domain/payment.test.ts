import { describe, expect, it } from 'vitest';
import { MatchPaymentCalculator } from './payment';

describe('MatchPaymentCalculator', () => {
  const calculator = new MatchPaymentCalculator();

  it('charges subscription only for non-vip without rent', () => {
    const result = calculator.calculate({ isVip: false, rentEquipment: false });

    expect(result.subscriptionCents).toBe(2000);
    expect(result.rentCents).toBe(0);
    expect(result.discountCents).toBe(0);
    expect(result.totalCents).toBe(2000);
    expect(result.benefits).toEqual([]);
  });

  it('charges subscription + rent for non-vip with rent', () => {
    const result = calculator.calculate({ isVip: false, rentEquipment: true });

    expect(result.subscriptionCents).toBe(0);
    expect(result.rentCents).toBe(5000);
    expect(result.discountCents).toBe(0);
    expect(result.totalCents).toBe(5000);
  });

  it('waives subscription for vip without rent', () => {
    const result = calculator.calculate({ isVip: true, rentEquipment: false });

    expect(result.subscriptionCents).toBe(0);
    expect(result.rentCents).toBe(0);
    expect(result.discountCents).toBe(0);
    expect(result.totalCents).toBe(0);
    expect(result.benefits).toEqual(['VIP: inscrição gratuita.']);
  });

  it('applies vip rent discount when renting equipment', () => {
    const result = calculator.calculate({ isVip: true, rentEquipment: true });

    expect(result.subscriptionCents).toBe(0);
    expect(result.rentCents).toBe(5000);
    expect(result.discountCents).toBe(1500);
    expect(result.totalCents).toBe(3500);
    expect(result.benefits).toEqual(['VIP: inscrição gratuita.', 'VIP: 30% de desconto no aluguel.']);
  });
});
