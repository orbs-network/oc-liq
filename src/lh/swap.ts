import BN from 'bignumber.js';
import binanceClient from "../cex/bnnc/client";
import { binanceTickSizes, binanceStepSizes, getSupportedSymbols } from "../cex/bnnc/info";
import { FEES_SPREAD_BPS, REVENUE_SPREAD_BPS } from "../config";
import { onchainTokenInfoToBinance } from "../cex/bnnc/onchainTo";
import { formatPrice, formatQuantity, fromBaseUnit, calcSpreadBps, throwUnless, toBaseUnit, applySpreadBps } from "../utils/calc";
import { encodeReactorTransferMsg } from "../lh/onchain-orders";
import dotenv from 'dotenv';
import { sendToKibana } from "../bi/kibana";

dotenv.config();


export async function onDutchSwap(chainId: number, inToken: string, outToken: string, amountIn: string, minAmountOut: string, filler: string, sessionId: string) {
  const { tokenInSymbol, tokenOutSymbol, tokenInDecimals, tokenOutDecimals } = await onchainTokenInfoToBinance(chainId, inToken, outToken)

  console.log({ sessionId, tokenInSymbol, tokenOutSymbol, tokenInDecimals, tokenOutDecimals });

  const supportedSymbols = await getSupportedSymbols()

  let pair

  // validate amount out is above min amount out

  // send fok limit order 

  // fok limit price should be such that we will receive more the min amount out

  // convert json token in/out to binance pair 
  // tokenIn means in to LH so it out for user and it should be out for binance
  // because if user buy token-x we should also buy on binance and sell onchain
  // in token is base asset and out token is quote asset
  if (supportedSymbols.includes(tokenInSymbol + tokenOutSymbol)) {// e.g: users sells btc
    pair = tokenInSymbol + tokenOutSymbol

    const tickSize = (await binanceTickSizes)[pair];
    const stepSize = (await binanceStepSizes)[pair];

    let inAmountF = fromBaseUnit(amountIn, tokenInDecimals)
    // TODO: handle min, max amounts
    let formattedInAmountF = formatQuantity(inAmountF, stepSize)

    let inAmountSpreadBps = calcSpreadBps(formattedInAmountF, inAmountF)
    let minAmountOutF = fromBaseUnit(minAmountOut, tokenOutDecimals)
    // let formattedMinAmountOutF = formatPrice(minAmountOutF, tickSize)

    const limitPrice = formatPrice(minAmountOutF / (1 - FEES_SPREAD_BPS / 10000) / formattedInAmountF, tickSize)

    throwUnless(
      limitPrice * formattedInAmountF >= minAmountOutF,
      `unexpected limit price (limitPrice * inAmountF < minAmountOutF): limitPrice = ${limitPrice}, inAmountF = ${inAmountF} < minAmountOutF = ${minAmountOutF}`
    )

    console.log({ amountIn, inAmountF, formattedInAmountF, minAmountOut, limitPrice, tokenInDecimals });

    console.log(`submitting new order to binance`);

    let res = await binanceClient.submitNewOrder({
      symbol: pair,
      side: 'SELL',
      type: 'LIMIT',
      timeInForce: 'FOK',
      quantity: formattedInAmountF,
      price: limitPrice
    })

    console.log(`submitted order result: ${JSON.stringify(res)}`);

    throwUnless(
      Number(res.cummulativeQuoteQty) >= minAmountOutF,
      `binance out amount is smaller than min amount out: cummulativeQuoteQty=${res.cummulativeQuoteQty}, minAmountOutF = ${minAmountOutF}`
    )

    const outAmountAfterSpread = Math.max(
      applySpreadBps(res.cummulativeQuoteQty, REVENUE_SPREAD_BPS),
      minAmountOutF
    )

    throwUnless(
      outAmountAfterSpread <= Number(res.cummulativeQuoteQty),
      `the amount we send to user onchain should be smaller or quall to the amount we get offchain: outAmountAfterSpread=${outAmountAfterSpread}, binanceInAmount=${res.cummulativeQuoteQty}`
    )

    const outAmountAfterSpreadBaseUnits = toBaseUnit(outAmountAfterSpread, tokenOutDecimals)

    sendToKibana({
      type: 'swap',
      sessionId: sessionId,
      tokenInSymbol: tokenInSymbol,
      tokenInDecimals: tokenInDecimals,
      tokenIn: inToken,
      tokenOutSymbol: tokenOutSymbol,
      tokenOutDecimals: tokenOutDecimals,
      tokenOut: outToken,
      binanceStatus: res.status,
      binanceSide: 'SELL',
      binanceTimeInForce: 'FOK',
      binanceOrderType: 'LIMIT',
      binanceBuyAmount: res?.cummulativeQuoteQty,
      binanceSellAmount: inAmountF,
      binanceLimitPrice: limitPrice,
      binancePair: pair,
      inAmountF,
      formattedInAmountF,
      minAmountOutF,
      inAmountSpreadBps,
      outAmountSpreadBps: calcSpreadBps(fromBaseUnit(outAmountAfterSpreadBaseUnits, tokenOutDecimals), Number(res.cummulativeQuoteQty)),
      FEES_SPREAD_BPS: FEES_SPREAD_BPS,
      REVENUE_SPREAD_BPS: REVENUE_SPREAD_BPS,
    })

    if (res.status == 'FILLED') {
      return encodeReactorTransferMsg(chainId, outAmountAfterSpreadBaseUnits, amountIn, minAmountOut, outToken, inToken, filler)
    } else {
      throw Error(`failed to execute binace order`)
    }

  }
  // here outToken is base asset and inToken is quote asset
  else if (supportedSymbols.includes(tokenOutSymbol + tokenInSymbol)) { // e.g.: user buy btc
    pair = tokenOutSymbol + tokenInSymbol

    const tickSize = (await binanceTickSizes)[pair];
    const stepSize = (await binanceStepSizes)[pair];

    let inAmountF = fromBaseUnit(amountIn, tokenInDecimals)
    let minAmountOutF = fromBaseUnit(BN.max(minAmountOut, 1), tokenOutDecimals)

    let res //: any = {status: 'FILLED', executedQty: minAmountOut}

    const limitPrice = formatPrice(inAmountF * (1 - FEES_SPREAD_BPS / 10000) / minAmountOutF, tickSize)

    console.log({ amountIn, inAmountF, minAmountOut, limitPrice, tokenInDecimals });

    res = await binanceClient.submitNewOrder({
      symbol: pair,
      side: 'BUY',
      type: 'LIMIT',
      timeInForce: 'FOK',
      quoteOrderQty: inAmountF,
      // without fees : minAmountOutF * price <= inAmountF
      // we pay fees on binance with the binance output token which is the onchain input token therefore
      // with fees: minAmountOutF * price <= inAmountF * (1 - fees) => price <= inAmountF * (1 - fees) / minAmountOutF
      // the min amount in base we get before fees is: M = inAmountF / (inAmountF * (1 - FEES_SPREAD_BPS / 10000) / minAmountOutF) => 
      // M = minAmountOutF / (1 - FEES_SPREAD_BPS / 10000)
      // and after fees is minAmountOutF * (1 -F) / (1 - FEES_SPREAD_BPS / 10000)
      // since FEES_SPREAD_BPS > F it is ensured that we will get at least minAmountOutF
      price: limitPrice
    })

    console.log(`submit order result: ${JSON.stringify(res)}`);
    // TODO: add spread on amount out

    sendToKibana({
      type: 'swap',
      sessionId: sessionId,
      tokenInSymbol: tokenInSymbol,
      tokenInDecimals: tokenInDecimals,
      tokenIn: inToken,
      tokenOutSymbol: tokenOutSymbol,
      tokenOutDecimals: tokenOutDecimals,
      tokenOut: outToken,
      binanceStatus: res.status,
      binanceSide: 'BUY',
      binanceInType: 'Quote',
      binanceBuyAmount: inAmountF,
      binanceSellAmount: res.executedQty,
      binanceLimitPrice: limitPrice,
      binancePair: pair
    })

    if (res.status == 'FILLED') {
      return encodeReactorTransferMsg(chainId, toBaseUnit(Number(res.executedQty), tokenOutDecimals), amountIn, minAmountOut, outToken, inToken, filler)
    } else {
      throw Error(`failed to execute binace order`)
    }

  } else {
    console.log(`symbol not supported tokenInSymbol=${tokenInSymbol}, tokenOutSymbol=${tokenOutSymbol}`)
    return
  }

}


// onDutchSwap(
//     137,
//     "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
//     "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
//     "10000",
//     "0",
//     "0x0"
//   )
//     .then(console.log)
//     .catch(console.error)
