import { ActualType } from '@actual-app/api';

const accounts = [{ up: '', actual: '' }];

const mapping = new Map(accounts.map((v) => [v.up, v.actual]));

export function getActualAccountId(up: string): ActualType.Id | undefined {
  if (!mapping.has(up)) {
    return;
  }
  return mapping.get(up) as ActualType.Id;
}
