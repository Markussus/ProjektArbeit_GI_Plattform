import { useEffect, useRef } from "react";
import { create } from "zustand";
import { exportTrainingCenterValue } from "@/lib/trainingCenter";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";

interface ActiveSimulatorTransfer {
  registrationId: number;
  exportValue: () => Promise<string>;
}

interface ActiveSimulatorTransferState {
  activeTransfer: ActiveSimulatorTransfer | null;
  register: (exportValue: () => Promise<string>) => () => void;
}

let nextRegistrationId = 1;

export const useActiveSimulatorTransferStore =
  create<ActiveSimulatorTransferState>((set) => ({
    activeTransfer: null,
    register(exportValue) {
      const registrationId = nextRegistrationId++;
      set({ activeTransfer: { registrationId, exportValue } });

      return () => {
        set((state) =>
          state.activeTransfer?.registrationId === registrationId
            ? { activeTransfer: null }
            : state,
        );
      };
    },
  }));

interface UseActiveSimulatorTransferOptions<TValue> {
  identifier: string;
  value: TValue;
  codec: ISimulatorTransferCodec<TValue>;
  enabled?: boolean;
}

export function useActiveSimulatorTransfer<TValue>({
  identifier,
  value,
  codec,
  enabled = true,
}: UseActiveSimulatorTransferOptions<TValue>) {
  const latestRef = useRef({ identifier, value, codec });

  useEffect(() => {
    latestRef.current = { identifier, value, codec };
  }, [codec, identifier, value]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return useActiveSimulatorTransferStore.getState().register(() => {
      const latest = latestRef.current;
      return exportTrainingCenterValue(
        latest.identifier,
        latest.value,
        latest.codec,
      );
    });
  }, [enabled]);
}
