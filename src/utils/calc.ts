import BN from 'bignumber.js';


export function getAmountOutQuote(orderBook: any, amountInBase: number) {
  let cumulativeAmountBase = 0; // Cumulative base amount (BTC)
  let amountOutQuote = 0;   // Cumulative quote amount (USDT)
  let depth = 0;

  for (let i = 0; i < orderBook.length; i++) {
    const [priceQuoteStr, amountBaseStr] = orderBook[i];
    const priceQuote = parseFloat(priceQuoteStr);  // Price in quote asset (e.g., USDT per BTC)
    const amountBase = parseFloat(amountBaseStr); // Amount in base asset (e.g., BTC)

    if (cumulativeAmountBase + amountBase <= amountInBase) {
      // Add the full amount from this bid
      cumulativeAmountBase += amountBase;
      amountOutQuote += priceQuote * amountBase; // Add the corresponding quote amount (USDT)
      depth = i + 1; // Update depth to the current index (1-based)
    } else {
      // Add only the remaining base asset needed to reach amountInBase
      const remainingAmountBase = amountInBase - cumulativeAmountBase;
      cumulativeAmountBase += remainingAmountBase;
      amountOutQuote += priceQuote * remainingAmountBase;
      depth = i + 1; // Update depth to the current index (1-based)
      break; // We have reached the required amountInBase
    }
  }

  // Calculate the average price (weighted by base asset amount)
  const avgPrice = amountOutQuote / amountInBase;

  return { avgPrice, depth, amountOutQuote };
}

export function getAmountOutBase(orderBook: any, amountInQuote: number) {
  let cumulativeAmountQuote = 0; // Cumulative quote amount (USDT)
  let amountOutBase = 0;    // Cumulative base amount (BTC)
  let depth = 0;

  for (let i = 0; i < orderBook.length; i++) {
    const [priceQuoteStr, amountBaseStr] = orderBook[i];
    const priceQuote = parseFloat(priceQuoteStr);  // Price in quote asset (e.g., USDT per BTC)
    const amountBase = parseFloat(amountBaseStr); // Amount in base asset (e.g., BTC)
    const totalCostForAmountBase = priceQuote * amountBase; // Total quote asset for this base asset amount

    if (cumulativeAmountQuote + totalCostForAmountBase <= amountInQuote) {
      // Add the full amount of base asset at this price
      cumulativeAmountQuote += totalCostForAmountBase;
      amountOutBase += amountBase; // Add the corresponding base asset (BTC)
      depth = i + 1; // Update depth to the current index (1-based)
    } else {
      // Add only the remaining quote asset needed to reach amountInQuote
      const remainingQuoteAmount = amountInQuote - cumulativeAmountQuote;
      const remainingBaseAmount = remainingQuoteAmount / priceQuote; // Convert quote asset to base asset based on current price
      cumulativeAmountQuote += remainingQuoteAmount;
      amountOutBase += remainingBaseAmount;
      depth = i + 1;
      break; // We have reached the required amountInQuote
    }
  }

  // Calculate the average price (weighted by amount of base asset bought with quote asset)
  const avgPrice = amountInQuote / amountOutBase;

  return { avgPrice, depth, amountOutBase };
}


export function _formatPrice(price: number, tickSize: string): number {
  const tickSizeNum = parseFloat(tickSize);

  const flooredPrice = Math.floor(price / tickSizeNum) * tickSizeNum;

  const tickSizeDecimalPlaces = tickSize.split('.')[1].length;

  return parseFloat(flooredPrice.toFixed(tickSizeDecimalPlaces));
}

export function formatPrice(price: number, tickSize: string): number {
  return Number(BN(price).div(tickSize).integerValue(BN.ROUND_UP).multipliedBy(tickSize))
}

export function formatQuantity(quantity: number, stepSize: string): number {
  return Number(BN(quantity).div(stepSize).integerValue(BN.ROUND_DOWN).multipliedBy(stepSize))
}

export function toBaseUnit(amount: number, decimals: number): string {
  return new BN(amount).multipliedBy(new BN(10).pow(decimals)).toFixed(0);
}

export function fromBaseUnit(amount: BN | string, decimals: number): number {
  return Number(BN(amount).dividedBy(new BN(10).pow(decimals)));
}


export function throwIf(cond: boolean, msg: string) {
  if (cond) throw Error(msg)
}

export function throwUnless(cond: boolean, msg: string) {
  if (!cond) throw Error(msg)
}

export function calcSpreadBps(start: number | string, end: number | string): number {
  // (end / start - 1) * 10,000
  return Number(BN(end).div(start).minus(1).multipliedBy(10000).toString())
}

export function applySpreadBps(end: number | string, spread: number | string): number {
  // start = end / (1 + spread / 10,000)
  // spread = (end / start - 1) * 10,000 
  return Number(BN(end).dividedBy(1 + Number(spread) / 10000).toString())
}