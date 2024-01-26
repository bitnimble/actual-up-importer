import {
  Transaction,
  deleteTransaction,
  getPayees,
  importTransactions,
  updateTransaction,
} from '@actual-app/api';
import { createHmac } from 'crypto';
import { Request, Response } from 'express';
import { Relationship, RelationshipData, UpApi, WebhookEventCallback } from 'up-bank-api';
import { getActualAccountId } from './accounts';
import { importedIdFor, mapTransaction } from './transaction';

const upApi = new UpApi(process.env.UP_API_KEY || '');

const UP_WEBHOOK_SECRET = process.env.UP_WEBHOOK_SECRET || '';

const buildSignature = (body) => createHmac('sha256', UP_WEBHOOK_SECRET).update(body).digest('hex');

export async function webhook(req: Request, res: Response) {
  const _403 = () => res.send(JSON.stringify({ statusCode: 403, body: '' }));
  const _200 = () => res.send(JSON.stringify({ statusCode: 200, body: '' }));

  const body = req.body || '';
  const headers = Object.entries(req.headers).reduce(
    (acc, [key, val]) => ({ ...acc, [key.toLowerCase()]: val }),
    {}
  );

  console.log(`Webhook: ${body}`);
  const expectedSignature = headers['x-up-authenticity-signature'];
  const actualSignature = buildSignature(body);
  if (expectedSignature !== actualSignature) {
    console.log(`Invalid signature - expected: ${expectedSignature}, actual: ${actualSignature}`);
    return _403();
  }

  const parsedBody = JSON.parse(body);

  if (!parsedBody.data || parsedBody.data.type !== 'webhook-events') {
    return _200();
  }

  const webhookEventData = (parsedBody as WebhookEventCallback).data;

  const transaction = webhookEventData.relationships.transaction;
  if (!transaction) {
    return _200();
  }
  if (webhookEventData.attributes.eventType === 'TRANSACTION_CREATED') {
    await transactionCreated(transaction);
  } else if (webhookEventData.attributes.eventType === 'TRANSACTION_SETTLED') {
    await transactionUpdated(transaction);
  } else if (webhookEventData.attributes.eventType === 'TRANSACTION_DELETED') {
    await transactionDeleted(transaction);
  } else {
    console.log('Skipping');
  }

  return _200();
}

export async function transactionCreated(t: Relationship<RelationshipData<'transactions'>>) {
  console.log('Creating transaction');
  const upTransaction = (await upApi.transactions.retrieve(t.data.id)).data;
  console.log(`Up Transaction: ${JSON.stringify(upTransaction)}`);

  let transaction: Transaction;
  if (upTransaction.relationships.transferAccount.data?.id) {
    console.log('Internal transfer');
    if (upTransaction.attributes.amount.valueInBaseUnits < 0) {
      console.log('Skipping negative side of internal transfer');
      return;
    }

    const sourceId = getActualAccountId(upTransaction.relationships.account.data.id);
    const destId = getActualAccountId(upTransaction.relationships.transferAccount.data.id);

    if (sourceId === destId) {
      console.log('Attempting to create transfer between same Actual account. Skipping');
      return;
    }

    const payees = await getPayees();
    const transferPayee = payees.find((p) => p.transfer_acct === destId);

    if (!transferPayee) {
      throw "Can't find transfer payee!";
    }

    transaction = mapTransaction(upTransaction, transferPayee.id);
  } else {
    transaction = mapTransaction(upTransaction);
  }

  await importTransactions(transaction.account, [transaction]);
}

export async function transactionUpdated(t: Relationship<RelationshipData<'transactions'>>) {
  console.log('Updating transaction');
  const upTransaction = (await upApi.transactions.retrieve(t.data.id)).data;
  console.log(`Up Transaction: ${JSON.stringify(upTransaction)}`);

  const transaction = mapTransaction(upTransaction);
  // const existingTransaction = await runQuery(
  //   q('transactions')
  //     .filter({
  //       'imported_id': upTransaction.id,
  //     })
  //     .select(['id'])
  // );
  // if (existingTransaction.data.length !== 1) {
  //   return;
  // }
  await updateTransaction(importedIdFor(t.data.id), transaction);
}

export async function transactionDeleted(t: Relationship<RelationshipData<'transactions'>>) {
  console.log('Deleting transaction');
  await deleteTransaction(importedIdFor(t.data.id));
}
