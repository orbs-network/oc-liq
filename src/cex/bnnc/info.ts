import binanceClient from "./client"


// TODO add cache

export async function getSupportedSymbols() {
  const info = await exchangeInfo;

  if (!info) {
    throw new Error('Exchange info is not available');
  }

  return info.symbols
    .filter((symbolInfo: any) => symbolInfo.status === 'TRADING')
    .map((symbolInfo: any) => symbolInfo.symbol);
}

async function fetchExchangeInfo() {
  try {
    const exchangeInfo = await binanceClient.getExchangeInfo();
    return exchangeInfo;
  } catch (error) {
    console.error("Error fetching exchange info:", error);
    return null;
  }
}

export async function processTickSizes() {
  const info = await exchangeInfo;

  if (!info) {
    throw new Error('Exchange info is not available');
  }

  const tickSizes: { [symbol: string]: string } = {};

  info.symbols.forEach((symbolInfo: any) => {
    const priceFilter = symbolInfo.filters.find((f: any) => f.filterType === 'PRICE_FILTER');
    if (priceFilter) {
      tickSizes[symbolInfo.symbol] = priceFilter.tickSize;
    }
  });

  return tickSizes;
}

export async function processStepSizes() {
  const info = await exchangeInfo;

  if (!info) {
    throw new Error('Exchange info is not available');
  }

  const stepSizes: { [symbol: string]: string } = {};

  info.symbols.forEach((symbolInfo: any) => {
    const lotSizeFilter = symbolInfo.filters.find((f: any) => f.filterType === 'LOT_SIZE');
    if (lotSizeFilter) {
      stepSizes[symbolInfo.symbol] = lotSizeFilter.stepSize;
    }
  });

  return stepSizes;
}
export const exchangeInfo = (async () => {
  return await fetchExchangeInfo();
})();

export const binanceTickSizes = (async () => {
  const info = await exchangeInfo;
  return processTickSizes();
})();

export const binanceStepSizes = (async () => {
  const info = await exchangeInfo;
  return processStepSizes();
})();
