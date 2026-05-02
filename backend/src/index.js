import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import apiRouter from './routes/api.js';
import { initPriceSocket } from './ws/priceSocket.js';

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));
app.use('/api', apiRouter);

const server = createServer(app);
initPriceSocket(server);

server.listen(PORT, () => {
  console.log(`APEX TERMINAL backend running on http://localhost:${PORT}`);
});
