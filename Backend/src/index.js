require('dotenv').config();

const express = require('express');
const cors = require('cors');

const expensesRouter = require('./routes/expenses');
const exportsRouter = require('./routes/exports');
const profileRouter = require('./routes/profile');
const syncRouter = require('./routes/sync');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      // Allow any localhost / 127.0.0.1 port (CRA, Electron, alternate dev ports)
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

app.use('/api', expensesRouter);
app.use('/api', exportsRouter);
app.use('/api', profileRouter);
app.use('/api/sync', syncRouter);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
