import { ActualType } from '@actual-app/api';

const accounts = [{ up: '', actual: '' }];

const mapping = new Map(accounts.map((v) => [v.up, v.actual]));

export function getActualAccountId(up: string): ActualType.Id {
  if (!mapping.has(up)) {
    // Use first account as a catch-all
    return mapping.get(accounts[0].up) as ActualType.Id;
  }
  return mapping.get(up) as ActualType.Id;
}
