const SILVER_PER_GOLD = 5;

function normalizeAmount(value) {
  return Math.max(0, Math.floor(Number(value || 0)));
}

function currency(gold = 0, silver = 0) {
  return {
    gold: normalizeAmount(gold),
    silver: normalizeAmount(silver),
  };
}

function normalizeCurrency(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return currency(value.gold, value.silver);
  }

  const legacyTotalSilver = normalizeAmount(value);

  return {
    gold: Math.floor(legacyTotalSilver / SILVER_PER_GOLD),
    silver: legacyTotalSilver % SILVER_PER_GOLD,
  };
}

function currencyValueInSilver(value) {
  const normalized = normalizeCurrency(value);

  return normalized.gold * SILVER_PER_GOLD + normalized.silver;
}

function canAffordCurrency(wallet, price) {
  return currencyValueInSilver(wallet) >= currencyValueInSilver(price);
}

function spendCurrency(wallet, price) {
  const current = normalizeCurrency(wallet);
  let remainingCost = currencyValueInSilver(price);
  let nextGold = current.gold;
  let nextSilver = current.silver;

  if (remainingCost <= 0) {
    return current;
  }

  const silverSpent = Math.min(nextSilver, remainingCost);
  nextSilver -= silverSpent;
  remainingCost -= silverSpent;

  if (remainingCost > 0) {
    const goldNeeded = Math.ceil(remainingCost / SILVER_PER_GOLD);
    const silverFromGold = goldNeeded * SILVER_PER_GOLD;

    nextGold -= goldNeeded;
    nextSilver += silverFromGold - remainingCost;
  }

  return currency(nextGold, nextSilver);
}

module.exports = {
  SILVER_PER_GOLD,
  canAffordCurrency,
  currency,
  currencyValueInSilver,
  normalizeCurrency,
  spendCurrency,
};
