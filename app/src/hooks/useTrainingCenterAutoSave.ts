import { useCallback, useEffect, useRef } from "react";
import { exportAndStoreTrainingCenterValue } from "@/lib/trainingCenter";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";

export const DEFAULT_TRAINING_CENTER_AUTO_SAVE_INTERVAL = 10_000;

export interface UseTrainingCenterAutoSaveOptions<TValue> {
  identifier: string;
  value: TValue;
  codec: ISimulatorTransferCodec<TValue>;
  enabled?: boolean;
  intervalMs?: number;
  onError?: (error: unknown) => void;
}

export function useTrainingCenterAutoSave<TValue>({
  identifier,
  value,
  codec,
  enabled = true,
  intervalMs = DEFAULT_TRAINING_CENTER_AUTO_SAVE_INTERVAL,
  onError,
}: UseTrainingCenterAutoSaveOptions<TValue>) {
  const latestRef = useRef({ identifier, value, codec, onError });

  useEffect(() => {
    latestRef.current = { identifier, value, codec, onError };
  }, [identifier, value, codec, onError]);

  const save = useCallback(async (): Promise<string> => {
    const latest = latestRef.current;

    try {
      return await exportAndStoreTrainingCenterValue(
        latest.identifier,
        latest.value,
        latest.codec,
      );
    } catch (error) {
      latest.onError?.(error);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
      throw new Error("training_center_auto_save_interval_invalid");
    }

    const intervalId = window.setInterval(() => {
      void save().catch(() => undefined);
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [enabled, intervalMs, save]);

  return save;
}
