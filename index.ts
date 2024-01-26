import 'dotenv/config';
import express from 'express';
import { webhook } from './webhook';
import * as api from '@actual-app/api';

async function main() {
  await api.init({
    dataDir: './tmp',
    serverURL: 'http://localhost:5006',
    password: process.env.ACTUAL_PW,
  });
  await api.downloadBudget(process.env.ACTUAL_BUDGET);

  const app = express();
  app.use(
    express.raw({
      type: 'application/json',
    })
  );

  app.post('/webhook', webhook);
  app.listen(5987, () => {
    console.log('Listening on 5987');
  });
}
main();
