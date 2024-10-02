import express from 'express';

import dx from './rout/dx'; // dexalot fashion  
import lh from './rout/lh'; // liquidity hub

const app = express();
const port = 3000;

// Mount the route modules
app.use('/lh', lh);
app.use('/dx', dx);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});