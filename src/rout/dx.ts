import express, { Router, Request, Response } from 'express';

// dexalot fashion
const route: Router = express.Router();

route.get('/rfq/prices', (req: Request, res: Response) => {
  // TODO: Implement DX RFQ prices logic

  res.send('DX RFQ Prices');
});

route.get('/rfq/firm', (req: Request, res: Response) => {
  // TODO: Implement DX RFQ firm logic
  res.send('DX RFQ Firm');
});

export default route;