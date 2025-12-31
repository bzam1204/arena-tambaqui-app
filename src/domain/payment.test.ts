import { describe, expect, it } from 'vitest';
import { MatchPaymentCalculator } from './payment';

describe('MatchPaymentCalculator', () => {
  const calculator = new MatchPaymentCalculator();

  it('charges subscription only for non-vip without rent', () => {
    const result = calculator.calculate({ isVip: false, rentEquipment: false });

    expect(result.subscriptionCents).toBe(2000);
    expect(result.rentCents).toBe(0);
    expect(result.discountCents).toBe(0);
    expect(result.guestTotalCents).toBe(0);
    expect(result.totalCents).toBe(2000);
    expect(result.benefits).toEqual([]);
    expect(result.guestItems).toEqual([]);
    expect(result.includePlayer).toBe(true);
  });

  it('charges subscription + rent for non-vip with rent', () => {
    const result = calculator.calculate({ isVip: false, rentEquipment: true });

    expect(result.subscriptionCents).toBe(0);
    expect(result.rentCents).toBe(5000);
    expect(result.discountCents).toBe(0);
    expect(result.guestTotalCents).toBe(0);
    expect(result.totalCents).toBe(5000);
    expect(result.guestItems).toEqual([]);
  });

  it('waives subscription for vip without rent', () => {
    const result = calculator.calculate({ isVip: true, rentEquipment: false });

    expect(result.subscriptionCents).toBe(0);
    expect(result.rentCents).toBe(0);
    expect(result.discountCents).toBe(0);
    expect(result.guestTotalCents).toBe(0);
    expect(result.totalCents).toBe(0);
    expect(result.benefits).toEqual(['VIP: inscrição gratuita.']);
    expect(result.guestItems).toEqual([]);
  });

  it('applies vip rent discount when renting equipment', () => {
    const result = calculator.calculate({ isVip: true, rentEquipment: true });

    expect(result.subscriptionCents).toBe(0);
    expect(result.rentCents).toBe(5000);
    expect(result.discountCents).toBe(1500);
    expect(result.guestTotalCents).toBe(0);
    expect(result.totalCents).toBe(3500);
    expect(result.benefits).toEqual(['VIP: inscrição gratuita.', 'VIP: 30% de desconto no aluguel.']);
    expect(result.guestItems).toEqual([]);
  });

  it('adds guests without vip discounts', () => {
    const result = calculator.calculate({
      isVip: true,
      rentEquipment: false,
      guests: [
        { name: 'Convidado A', rentEquipment: false },
        { name: 'Convidado B', rentEquipment: true },
      ],
    });

    expect(result.subscriptionCents).toBe(0);
    expect(result.rentCents).toBe(0);
    expect(result.discountCents).toBe(0);
    expect(result.guestTotalCents).toBe(7000);
    expect(result.totalCents).toBe(7000);
    expect(result.guestItems.map((item) => item.totalCents)).toEqual([2000, 5000]);
  });

  it('supports guest-only payments', () => {
    const result = calculator.calculate({
      isVip: false,
      rentEquipment: false,
      includePlayer: false,
      guests: [{ name: 'Convidado', rentEquipment: true }],
    });

    expect(result.subscriptionCents).toBe(0);
    expect(result.rentCents).toBe(0);
    expect(result.discountCents).toBe(0);
    expect(result.guestTotalCents).toBe(5000);
    expect(result.totalCents).toBe(5000);
    expect(result.benefits).toEqual([]);
    expect(result.includePlayer).toBe(false);
  });
});
