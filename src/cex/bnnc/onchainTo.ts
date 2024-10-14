import redisClient from "../../redis-wrap";


// Define the type for the symbol mappings
interface SymbolMapping {
  [key: string]: string;
}

// Define the main structure with types
interface OnchainSymbolsToBinance {
  common: SymbolMapping;
  [chainId: number]: SymbolMapping;
}

// Now, define the object with the appropriate types
const onchainSymbolsToBinance: OnchainSymbolsToBinance = {
  common: {
    USDT: 'USDT',
    USDC: 'USDC',
    WETH: 'ETH',
    // WBTC: 'BTC',
    // WFTM: 'FTM',
    // WMATIC: 'POLY'
  }
}

function extractBinanceSymbolFromOnchainToken(chainId: number, token: string): string {
  const binanceSymbol = onchainSymbolsToBinance.common[token] || onchainSymbolsToBinance[chainId]?.[token]
  if (!binanceSymbol) throw Error(`unsupported token ${token}`) // TODO: add error type         

  return binanceSymbol
}

export async function onchainTokenInfoToBinance(chainId: number, inToken: string, outToken: string) {

  console.log({ inToken, outToken });

  let tokenOutInfo = JSON.parse(await redisClient.get(`token:${chainId}:${outToken}`) || '{}')
  let tokenInInfo = JSON.parse(await redisClient.get(`token:${chainId}:${inToken}`) || '{}')

  console.log({ tokenInInfo, tokenOutInfo });

  const tokenOutDecimals = tokenOutInfo.decimals
  const tokenInDecimals = tokenInInfo.decimals

  if (!tokenOutDecimals && tokenOutDecimals != 0 || !tokenInDecimals && tokenInDecimals != 0) {
    console.log(`skipping tokenOutDecimals (${tokenOutDecimals}) or tokenInDecimals (${tokenInDecimals}) is not defined`);
    throw Error(`skipping tokenOutDecimals or tokenInDecimals is not defined`)// TODO: add error types + catch
  }

  let tokenInSymbol = extractBinanceSymbolFromOnchainToken(chainId, tokenInInfo.symbol)
  let tokenOutSymbol = extractBinanceSymbolFromOnchainToken(chainId, tokenOutInfo.symbol)

  return {
    tokenInSymbol,
    tokenOutSymbol,
    tokenInDecimals,
    tokenOutDecimals
  }

}
