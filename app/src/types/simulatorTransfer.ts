export interface ISimulatorTransferCodec<TValue> {
  exportValue: (value: TValue) => string | Promise<string>;
  importValue: (serializedValue: string) => TValue | Promise<TValue>;
}
