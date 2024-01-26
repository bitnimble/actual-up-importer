import * as dotenv from 'dotenv';
import express from 'express';
import { webhook } from './webhook';
dotenv.config();

const app = express();

app.post('/webhook', webhook);
app.listen(5987, () => {
  console.log('Listening on 5987');
});
