import express, { Router, Request, Response } from 'express';

const route: Router = express.Router();

route.get('/rfq/prices', (req: Request, res: Response) => {
  // TODO: Implement LH RFQ prices logic
  res.send('LH RFQ Prices');
});

route.get('/rfq/firm', (req: Request, res: Response) => {
  // TODO: Implement LH RFQ firm logic
  res.send('LH RFQ Firm');
});

export default route;