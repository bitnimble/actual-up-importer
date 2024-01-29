import { ActualType, Transaction } from '@actual-app/api';
import { TransactionResource } from 'up-bank-api';
import { getActualAccountId } from './accounts';

export function importedIdFor(upId: string) {
  return `UP_BANK:${upId.slice(9)}`;
}

export function mapTransaction(
  up: TransactionResource,
  payeeId?: ActualType.Id
): Transaction | undefined {
  const actualAccount = getActualAccountId(up.relationships.account.data.id);
  if (!actualAccount) {
    return;
  }
  const base: Transaction = {
    account: actualAccount,
    amount: up.attributes.amount.valueInBaseUnits,
    date: up.attributes.createdAt.slice(0, 'YYYY-MM-DD'.length),
    cleared: up.attributes.status === 'SETTLED',
    imported_id: importedIdFor(up.id),
    notes: up.attributes.message || undefined,
  };

  if (payeeId) {
    return { ...base, payee: payeeId };
  }
  return { ...base, payee_name: up.attributes.description };
}
