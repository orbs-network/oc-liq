import { OrderResponseFull } from "binance";


export async function getBinanceOrderAvgPrice(orderRes: OrderResponseFull) {

  return orderRes.cummulativeQuoteQty
}