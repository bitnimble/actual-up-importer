import { ActualType } from '@actual-app/api';

const accounts = [{ up: '', actual: '' }];

const mapping = new Map(accounts.map((v) => [v.up, v.actual]));

export function getActualAccountId(up: string): ActualType.Id {
  if (!mapping.has(up)) {
    throw new Error(
      `Attempted to map Up account ${up} but could not find a matching Actual account`
    );
  }
  return mapping.get(up) as ActualType.Id;
}
