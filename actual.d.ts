import '@actual-app/api';

declare module '@actual-app/api' {
  namespace ActualType {
    export type Id = string & { _actualId: never }; // UUID
    export type Month = string; // YYYY-MM
    export type Date = string; // YYYY-MM-DD
    export type Amount = number; // currency value as an integer, e.g. cents
  }

  export type Transaction = {
    id?: ActualType.Id;
    account: ActualType.Id;
    date: ActualType.Date;
    amount?: ActualType.Amount;
    payee?: ActualType.Id;
    payee_name?: string;
    imported_payee?: string;
    category?: ActualType.Id;
    notes?: string;
    imported_id?: string;
    transfer_id?: string;
    cleared?: boolean;
    subtransactions?: Transaction[];
  };

  export type Payee = {
    id?: ActualType.Id;
    name: string;
    category?: ActualType.Id;
    transfer_acct?: ActualType.Id;
  };

  function getPayees(): Promise<Payee[]>;
}
