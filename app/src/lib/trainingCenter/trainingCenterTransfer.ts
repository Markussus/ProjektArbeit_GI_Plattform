import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import {
  createTrainingCenterStorageValue,
  parseTrainingCenterStorageValue,
  readTrainingCenterIdentifier,
} from "./trainingCenterIdentifier";
import { trainingCenterStorage } from "./trainingCenterStorage";

export async function exportAndStoreTrainingCenterValue<TValue>(
  identifier: string,
  value: TValue,
  codec: ISimulatorTransferCodec<TValue>,
): Promise<string> {
  const storageValue = await exportTrainingCenterValue(
    identifier,
    value,
    codec,
  );
  trainingCenterStorage.store(storageValue);
  return storageValue;
}

export async function exportTrainingCenterValue<TValue>(
  identifier: string,
  value: TValue,
  codec: ISimulatorTransferCodec<TValue>,
): Promise<string> {
  readTrainingCenterIdentifier(identifier);
  const payload = await codec.exportValue(value);
  return createTrainingCenterStorageValue(identifier, payload);
}

export async function loadTrainingCenterValue<TValue>(
  identifier: string,
  codec: ISimulatorTransferCodec<TValue>,
): Promise<TValue | null> {
  const storageValue = trainingCenterStorage.load(identifier);
  if (!storageValue) {
    return null;
  }

  const { payload } = parseTrainingCenterStorageValue(storageValue);
  if (!payload) {
    return null;
  }

  return codec.importValue(payload);
}

export function createTrainingCenterTransferCodec<TValue>(
  identifier: string,
  codec: ISimulatorTransferCodec<TValue>,
): ISimulatorTransferCodec<TValue> {
  readTrainingCenterIdentifier(identifier);

  return {
    exportValue: (value) =>
      exportAndStoreTrainingCenterValue(identifier, value, codec),
    async importValue(serializedValue) {
      const parsedValue = parseTrainingCenterStorageValue(serializedValue);
      if (parsedValue.identifier !== identifier || !parsedValue.payload) {
        throw new Error("training_center_transfer_identifier_invalid");
      }

      return codec.importValue(parsedValue.payload);
    },
  };
}
