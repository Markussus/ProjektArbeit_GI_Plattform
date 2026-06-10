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
  readTrainingCenterIdentifier(identifier);
  const payload = await codec.exportValue(value);
  const storageValue = createTrainingCenterStorageValue(identifier, payload);
  trainingCenterStorage.store(storageValue);
  return storageValue;
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
