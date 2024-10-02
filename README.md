# oc-liq

Off-chain liquidity server, on-chain DEX encoder and signer, CEX agent, and rebalancer.

## Project Overview

This TypeScript project implements an Express server that manages off-chain liquidity, interacts with on-chain DEXs, and handles CEX operations. It includes routing for Liquidity Hub (LH) and Order Book (OB), a CEX management class, and specific functionality for Binance.

## Features

1. Express server with two main routes:
   - Liquidity Hub (LH)
   - Order Book (OB)

2. Each route exposes two API endpoints:
   - `/rfq/firm`: Request for Quote (Firm)
   - `/rfq/prices`: Request for Quote (Prices)

3. CEX class for managing different central exchanges

4. Binance handler for order book management and trading

## Project Structure
