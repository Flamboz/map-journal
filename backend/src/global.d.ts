declare module "sql.js" {
  export type SqlValue = number | string | Uint8Array | null;

  export interface QueryExecResult {
    columns: string[];
    values: SqlValue[][];
  }

  export interface Statement {
    bind(values: readonly SqlValue[]): void;
    step(): boolean;
    getAsObject(): Record<string, SqlValue>;
    free(): void;
  }

  export interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): QueryExecResult[];
    export(): Uint8Array;
  }

  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }

  export default function initSqlJs(): Promise<SqlJsStatic>;
}
