import * as binance from 'binance';

import dotenv from 'dotenv';
dotenv.config();

const client = new binance.MainClient({
  api_key: process.env.BINANCE_API_KEY,
  api_secret: process.env.BINANCE_API_SECRET,
  // baseUrl: "https://testnet.binance.vision"
});

export default client
