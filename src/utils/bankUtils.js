export const SUPPORTED_BILL_PAY_BANKS = [
  'AxisBank',
  'ICICIBank',
  'AUSmallFinanceBank',
  'IDFCBank',
  'AMEX'
];

export const hasSupportedBillPayBank = (cards) => {
  if (!cards || !Array.isArray(cards) || cards.length === 0) return false;
  
  const normalizedBanks = SUPPORTED_BILL_PAY_BANKS.map(bank => 
    bank.toLowerCase().replace(/\s+/g, '')
  );

  return cards.some(card => {
    if (!card.bankName) return false;
    const normalizedCardBank = card.bankName.toLowerCase().replace(/\s+/g, '');
    return normalizedBanks.some(bank => normalizedCardBank.includes(bank));
  });
}; 