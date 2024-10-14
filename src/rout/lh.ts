import express, { Router, Request, Response } from 'express';
import { SOLVER_ID, config } from '../config';
import { onDutchSwap } from '../lh/swap';
import { onRfq } from '../lh/rfq';

const route: Router = express.Router();

route.get('/rfq/prices', (req: Request, res: Response) => {
  // TODO: Implement LH RFQ prices logic
  res.send('LH RFQ Prices');
});

route.get('/rfq/firm', (req: Request, res: Response) => {
  // TODO: Implement LH RFQ firm logic
  res.send('LH RFQ Firm');
});

route.post('/getBids', async (req, res) => {
  const { sessionId } = req.body
  const { network, orders, filler, pathFinderParams } = JSON.parse(req.body.dataStr);

  try {
    const chainId = Object.values(config).find(chain => chain.shortName === network)?.chainId
    if (!chainId) throw Error(`can not find chain id from network name ${network}`)

    const minOutAmount = pathFinderParams.min_output_amount
    console.log({ chainId, minOutAmount });
    const order = orders[0]

    console.log(`handling order ${order.id} with sessionId ${sessionId}`);

    const _res = await onDutchSwap(chainId, order.srcToken, order.dstToken, order.amountIn, minOutAmount, filler, sessionId)
    const fillData = { to: _res?.to, data: _res?.data }
    console.log({ fillData });

    res.status(200).json({
      result: [{
        success: true,
        route: { amountOut: _res?.outAmount },
        fillData: fillData,
        solverId: sessionId
      }]
    });
  }
  catch (error: any) {
    console.log({ error });

    res.status(500).json({
      success: false,
      message: error || 'Internal Server Error'
    });
  }
});


route.post('/quote', async (req, res) => {
  const { sessionId } = req.body

  const { network, orders } = JSON.parse(req.body.dataStr);

  try {
    const chainId = Object.values(config).find(chain => chain.shortName === network)?.chainId
    if (!chainId) throw Error(`can not find chain id from network name ${network}`)

    const order = orders[0]
    const amountOut = await onRfq(sessionId, chainId, order.srcToken, order.dstToken, order.amountIn)

    res.status(200).json({
      data: {
        success: true,
        result: [{
          route: { amountOut },
          solverId: SOLVER_ID
        }]
      }
    });
  }
  catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
});



export default route;