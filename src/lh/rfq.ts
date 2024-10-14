import BN from 'bignumber.js';

import binanceClient from "../cex/bnnc/client";
import { getSupportedSymbols } from "../cex/bnnc/info";
import { FEES_SPREAD_BPS } from "../config";
import { onchainTokenInfoToBinance } from "../cex/bnnc/onchainTo";
import { sendToKibana } from "../bi/kibana";
import { getAmountOutBase, getAmountOutQuote, toBaseUnit } from "../utils/calc";



export async function onRfq(sessionId: string, chainId: number, inToken: string, outToken: string, amountIn: string) {

  const { tokenInSymbol, tokenOutSymbol, tokenInDecimals, tokenOutDecimals } = await onchainTokenInfoToBinance(chainId, inToken, outToken)

  const supportedSymbols = await getSupportedSymbols()

  let pair, orderBook, res

  let inAmountF = Number((new BN(amountIn)).div(10 ** tokenInDecimals))

  console.log(`sessionId ${sessionId}, inAmountF: ${inAmountF}`);

  // convert json token in/out to binance pair 
  // tokenIn means in to LH so it out for user and it should be out for binance
  // because if user buy token-x we should also buy on binance and sell onchain
  // in token is base asset and out token is quote asset
  if (supportedSymbols.includes(tokenInSymbol + tokenOutSymbol)) {
    pair = tokenInSymbol + tokenOutSymbol

    // get from binance best bid/ask for pair with amounts
    orderBook = await binanceClient.getOrderBook({ symbol: pair, limit: 5 })

    res = getAmountOutQuote(orderBook.bids, inAmountF) // inAmountF is in Base assest, out amount is in Quote

    console.log(`sessionId ${sessionId}, pair: ${pair}, res: ${JSON.stringify(res)}`);

    const amountOut = toBaseUnit(res.amountOutQuote * (1 - FEES_SPREAD_BPS / 10000), tokenOutDecimals)

    sendToKibana({
      type: 'rfq',
      sessionId: sessionId,
      tokenInSymbol: tokenInSymbol,
      tokenInDecimals: tokenInDecimals,
      tokenIn: inToken,
      tokenOutSymbol: tokenOutSymbol,
      tokenOutDecimals: tokenOutDecimals,
      tokenOut: outToken,
      binancePair: pair,
      amountOut: amountOut,
      orderBookAvgPrice: res.avgPrice,
      orderBookDepth: res.depth,
      orderBookAmountOutQuote: res.amountOutQuote
    })

    // TODO: assuming we are paying in out asset, if using BNB we need to change this calc
    // if not using BNB the fees are paid in out asset
    return amountOut
  }
  // here out token is base asset and in token is quote asset
  else if (supportedSymbols.includes(tokenOutSymbol + tokenInSymbol)) {
    pair = tokenOutSymbol + tokenInSymbol

    // get from binance best bid/ask for pair with amounts
    orderBook = await binanceClient.getOrderBook({ symbol: pair, limit: 5 })

    res = getAmountOutBase(orderBook.asks, inAmountF) // inAmountF is in Quote assest, out amount is in Base

    console.log(`sessionId ${sessionId}, pair: ${pair}, res: ${JSON.stringify(res)}`);

    const amountOut = toBaseUnit(res.amountOutBase * (1 - FEES_SPREAD_BPS / 10000), tokenOutDecimals)

    sendToKibana({
      type: 'rfq',
      sessionId: sessionId,
      tokenInSymbol: tokenInSymbol,
      tokenInDecimals: tokenInDecimals,
      tokenIn: inToken,
      tokenOutSymbol: tokenOutSymbol,
      tokenOutDecimals: tokenOutDecimals,
      tokenOut: outToken,
      binancePair: pair,
      amountOut: amountOut,
      orderBookAvgPrice: res.avgPrice,
      orderBookDepth: res.depth,
      orderBookAmountOutBase: res.amountOutBase
    })

    // TODO: assuming we are paying in out asset, if using BNB we need to change this calc
    // if not using BNB the fees are paid in out asset
    return amountOut

  } else {
    console.log(`sessionId ${sessionId}, symbol not supported tokenInSymbol=${tokenInSymbol}, tokenOutSymbol=${tokenOutSymbol}`)
    return
  }

}

// onRfq(137, "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6", "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", "10000").then(console.log) // in - wbtc, out - usdc
// onRfq(137, "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6", "10000000").then(console.log) // in - usdc, out - wbtc