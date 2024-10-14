interface ChainConfig {
  chainId: number,
  name: string;
  shortName: string;
  reactor: string;
  executor: string;
}

// TODO: update addresses
export const config: { [key: string]: ChainConfig } = {
  250: {
    chainId: 250,
    name: 'FTM',
    shortName: 'ftm',
    reactor: '', // TODO: update correct address
    executor: '' // TODO: update correct address
  },
  137: {
    chainId: 137,
    name: 'polygon',
    shortName: 'polygon',
    reactor: '0xc19E284C8f5ccef721a761d0CA18dc8E9a612aFd',
    executor: '0x896D9b9Eee18F6C88C5575B78247834029375575'
  }
};


export const PERMIT2 = "0x000000000022d473030f116ddee9f6b43ac78ba3";

export const FEES_SPREAD_BPS = 5
export const REVENUE_SPREAD_BPS = 0

export const SOLVER_ID = 0x200

export const SUBMIT_BINANCE_ORDERS = false