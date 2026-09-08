/** @vitest-environment jsdom */

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EncoderSimulator,
  type EncoderSimulatorHandle,
} from "@/pages/FundamentalsCS/Encoding/simulator/EncoderSimulator";
import { createRef, type MouseEventHandler } from "react";
import type { Exercise, TopicItem } from "@/types/exercise";
import { FileText } from "lucide-react";
import type {
  GeneratedExercise,
  EncodingExerciseType,
} from "@/pages/FundamentalsCS/Encoding/utils/exerciseGenerator";
import {
  createTrainingCenterIdentifier,
  exportAndStoreTrainingCenterValue,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import {
  encTransferCodec,
  type EncoderState,
} from "@/pages/FundamentalsCS/Encoding/simulator/encTransferCodec";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

interface MockBase64Props {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  initialValue?: string;
  initialConverterMode?: string;
  onShowSolution?: () => void;
  onExitExercise?: () => void;
  onChangeState?: (state: {
    converterMode: "encode" | "decode";
    inputValue: string;
  }) => void;
}

interface MockUtf8Props {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  initialValue?: string;
  initialConverterMode?: string;
  onShowSolution?: () => void;
  onExitExercise?: () => void;
  onChangeState?: (state: {
    converterMode: "encode" | "decode";
    inputValue: string;
  }) => void;
}

vi.mock(
  "../../../../src/pages/FundamentalsCS/Encoding/simulator/Base64Encoder",
  () => ({
    Base64Encoder: (props: MockBase64Props) => (
      <div data-testid="mock-base64-encoder">
        <div data-testid="mock-base64-is-exercise">
          {String(props.isExerciseMode)}
        </div>
        <div data-testid="mock-base64-show-solution">
          {String(props.showSolution)}
        </div>
        <div data-testid="mock-base64-initial-value">
          {String(props.initialValue)}
        </div>
        <div data-testid="mock-base64-initial-mode">
          {String(props.initialConverterMode)}
        </div>
        <button
          data-testid="mock-base64-show-solution-button"
          onClick={props.onShowSolution as MouseEventHandler<HTMLButtonElement>}
        >
          show solution
        </button>
        <button
          data-testid="mock-base64-exit-exercise-button"
          onClick={props.onExitExercise as MouseEventHandler<HTMLButtonElement>}
        >
          exit exercise
        </button>
        <button
          data-testid="mock-base64-change-state-button"
          onClick={() =>
            props.onChangeState?.({
              converterMode: "encode",
              inputValue: "typed just now",
            })
          }
        >
          change state
        </button>
      </div>
    ),
  }),
);

vi.mock(
  "../../../../src/pages/FundamentalsCS/Encoding/simulator/UTF8Encoder",
  () => ({
    UTF8Encoder: (props: MockUtf8Props) => (
      <div data-testid="mock-utf8-encoder">
        <div data-testid="mock-utf8-is-exercise">
          {String(props.isExerciseMode)}
        </div>
        <div data-testid="mock-utf8-show-solution">
          {String(props.showSolution)}
        </div>
        <div data-testid="mock-utf8-initial-value">
          {String(props.initialValue)}
        </div>
        <div data-testid="mock-utf8-initial-mode">
          {String(props.initialConverterMode)}
        </div>
        <button
          data-testid="mock-utf8-show-solution-button"
          onClick={props.onShowSolution as MouseEventHandler<HTMLButtonElement>}
        >
          show solution
        </button>
        <button
          data-testid="mock-utf8-exit-exercise-button"
          onClick={props.onExitExercise as MouseEventHandler<HTMLButtonElement>}
        >
          exit exercise
        </button>
        <button
          data-testid="mock-utf8-change-state-button"
          onClick={() =>
            props.onChangeState?.({
              converterMode: "decode",
              inputValue: "E1 A0 A0",
            })
          }
        >
          change state
        </button>
      </div>
    ),
  }),
);

const mockIcon = FileText;

function createGeneratedExercise(
  mode: "base64" | "utf8",
  converterMode: "encode" | "decode",
  initialValue: string,
): GeneratedExercise & Exercise {
  return {
    id: `encoding.ex_generated_${mode}_${converterMode}` as never,
    titleKey: "encoding.ex_base64_encode_easy",
    descriptionKey: "encoding.ex_base64_encode_easy_desc",
    title: "Generated exercise title",
    description: "Generated exercise description",
    difficulty: "easy",
    icon: mockIcon,
    kind: "exercise",
    exerciseType: `${mode}_${converterMode}_easy` as EncodingExerciseType,
    mode,
    converterMode,
    initialValue,
    answer: "some_answer",
  };
}

function createExample(id: string): TopicItem {
  return {
    id: id as never,
    titleKey: "encoding.ex_base64_encode_easy",
    descriptionKey: "encoding.ex_base64_encode_easy_desc",
    title: "Example title",
    description: "Example description",
    difficulty: "easy",
    icon: mockIcon,
    kind: "exercise",
  };
}

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("EncoderSimulator", () => {
  beforeEach(() => {
    const storage = new MemoryStorage();
    vi.stubGlobal("localStorage", storage);
    vi.clearAllMocks();
    trainingCenterStorage.deleteAll();
  });

  afterEach(async () => {
    cleanup();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    trainingCenterStorage.deleteAll();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("when no exercise is selected", () => {
    it("renders the base64 encoder by default", () => {
      render(<EncoderSimulator />);
      expect(screen.getByTestId("mock-base64-encoder")).toBeTruthy();
    });

    it("shows both mode tabs", () => {
      render(<EncoderSimulator />);
      expect(screen.getByTestId("encoding-tab-base64")).toBeTruthy();
      expect(screen.getByTestId("encoding-tab-utf8")).toBeTruthy();
    });

    it("restores the saved free simulator state for utf8", async () => {
      const storedState: EncoderState = {
        activeMode: "utf8",
        utf8: { inputValue: "E1 A0 A0", converterMode: "decode" },
      };
      await exportAndStoreTrainingCenterValue(
        createTrainingCenterIdentifier(TOPIC_STORAGE_IDS.encoding),
        storedState,
        encTransferCodec,
      );

      render(<EncoderSimulator />);

      await waitFor(() =>
        expect(screen.getByTestId("mock-utf8-encoder")).toBeTruthy(),
      );
      expect(screen.getByTestId("mock-utf8-initial-value").textContent).toBe(
        "E1 A0 A0",
      );
      expect(screen.getByTestId("mock-utf8-initial-mode").textContent).toBe(
        "decode",
      );
    });

    it("restores the saved free simulator state for base64", async () => {
      const storedState: EncoderState = {
        activeMode: "base64",
        base64: { inputValue: "aGVsbG8=", converterMode: "decode" },
      };
      await exportAndStoreTrainingCenterValue(
        createTrainingCenterIdentifier(TOPIC_STORAGE_IDS.encoding),
        storedState,
        encTransferCodec,
      );

      render(<EncoderSimulator />);

      await waitFor(() =>
        expect(
          screen.getByTestId("mock-base64-initial-value").textContent,
        ).toBe("aGVsbG8="),
      );
      expect(screen.getByTestId("mock-base64-initial-mode").textContent).toBe(
        "decode",
      );
    });

    it("does not overwrite a change made while restore is in flight", async () => {
      const storedState: EncoderState = {
        activeMode: "utf8",
        utf8: { inputValue: "stored earlier", converterMode: "encode" },
      };
      await exportAndStoreTrainingCenterValue(
        createTrainingCenterIdentifier(TOPIC_STORAGE_IDS.encoding),
        storedState,
        encTransferCodec,
      );

      let finishRestore: (() => void) | undefined;
      vi.spyOn(encTransferCodec, "importValue").mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishRestore = () => resolve(storedState);
          }),
      );

      render(<EncoderSimulator />);
      await waitFor(() => expect(finishRestore).toBeTypeOf("function"));
      fireEvent.click(screen.getByTestId("mock-base64-change-state-button"));
      await act(async () => finishRestore?.());

      expect(screen.getByTestId("mock-base64-encoder")).toBeTruthy();
      expect(screen.queryByTestId("mock-utf8-encoder")).toBeNull();
    });

    it("clears the saved free simulator state on reset", async () => {
      const storedState: EncoderState = {
        activeMode: "utf8",
        utf8: { inputValue: "E1 A0 A0", converterMode: "decode" },
      };
      await exportAndStoreTrainingCenterValue(
        createTrainingCenterIdentifier(TOPIC_STORAGE_IDS.encoding),
        storedState,
        encTransferCodec,
      );

      const ref = createRef<EncoderSimulatorHandle>();
      render(<EncoderSimulator ref={ref} />);

      await waitFor(() =>
        expect(screen.getByTestId("mock-utf8-encoder")).toBeTruthy(),
      );

      act(() => {
        ref.current?.resetStoredState();
      });

      expect(
        trainingCenterStorage.load(
          createTrainingCenterIdentifier(TOPIC_STORAGE_IDS.encoding),
        ),
      ).toBe("");
      expect(screen.getByTestId("mock-base64-encoder")).toBeTruthy();
    });
  });

  describe("when switching between mode tabs", () => {
    it("switches to utf8 encoder when utf8 tab is clicked", () => {
      render(<EncoderSimulator />);
      fireEvent.click(screen.getByTestId("encoding-tab-utf8"));
      expect(screen.getByTestId("mock-utf8-encoder")).toBeTruthy();
    });

    it("switches back to base64 encoder when base64 tab is clicked", () => {
      render(<EncoderSimulator />);
      fireEvent.click(screen.getByTestId("encoding-tab-utf8"));
      fireEvent.click(screen.getByTestId("encoding-tab-base64"));
      expect(screen.getByTestId("mock-base64-encoder")).toBeTruthy();
    });
  });

  describe("when an exercise is selected", () => {
    it("maps generated base64 exercise to base64 mode", () => {
      render(
        <EncoderSimulator
          selectedExercise={createGeneratedExercise(
            "base64",
            "decode",
            "SGVsbG8=",
          )}
        />,
      );

      expect(screen.getByTestId("mock-base64-encoder")).toBeTruthy();
      expect(
        screen.getByTestId("mock-base64-initial-mode").textContent,
      ).toContain("decode");
      expect(
        screen.getByTestId("mock-base64-initial-value").textContent,
      ).toContain("SGVsbG8=");
      expect(
        screen.getByTestId("mock-base64-is-exercise").textContent,
      ).toContain("true");
    });

    it("maps generated utf8 exercise to utf8 mode", () => {
      render(
        <EncoderSimulator
          selectedExercise={createGeneratedExercise("utf8", "encode", "A")}
        />,
      );

      expect(screen.getByTestId("mock-utf8-encoder")).toBeTruthy();
      expect(
        screen.getByTestId("mock-utf8-initial-mode").textContent,
      ).toContain("encode");
      expect(
        screen.getByTestId("mock-utf8-initial-value").textContent,
      ).toContain("A");
      expect(screen.getByTestId("mock-utf8-is-exercise").textContent).toContain(
        "true",
      );
    });

    it("does not overwrite or save into the free simulator slot", async () => {
      const freeIdentifier = createTrainingCenterIdentifier(
        TOPIC_STORAGE_IDS.encoding,
      );
      const initialFreeState: EncoderState = {
        activeMode: "utf8",
        utf8: { inputValue: "original free", converterMode: "encode" },
      };
      await exportAndStoreTrainingCenterValue(
        freeIdentifier,
        initialFreeState,
        encTransferCodec,
      );

      render(
        <EncoderSimulator
          selectedExercise={createGeneratedExercise(
            "base64",
            "decode",
            "SGVsbG8=",
          )}
        />,
      );

      // Wait a tick to ensure no autosave fired
      await new Promise((resolve) => setTimeout(resolve, 50));

      const loaded = trainingCenterStorage.load(freeIdentifier);
      expect(loaded).not.toBe("");
      const parsed = await encTransferCodec.importValue(
        loaded.slice(freeIdentifier.length),
      );
      expect(parsed.activeMode).toBe("utf8");
      expect(parsed.utf8?.inputValue).toBe("original free");
    });
  });

  describe("when an example is selected", () => {
    it("sets showSolution to true and mode to base64 for example_base64_1", () => {
      render(
        <EncoderSimulator
          selectedExercise={createExample("encoding.example_base64_1")}
        />,
      );

      expect(screen.getByTestId("mock-base64-encoder")).toBeTruthy();
      expect(
        screen.getByTestId("mock-base64-show-solution").textContent,
      ).toContain("true");
      expect(
        screen.getByTestId("mock-base64-is-exercise").textContent,
      ).toContain("false");
    });

    it("does not modify the free simulator storage slot", async () => {
      const freeIdentifier = createTrainingCenterIdentifier(
        TOPIC_STORAGE_IDS.encoding,
      );
      render(
        <EncoderSimulator
          selectedExercise={createExample("encoding.example_base64_1")}
        />,
      );

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(trainingCenterStorage.load(freeIdentifier)).toBe("");
    });
  });

  describe("when in exercise mode without solution shown", () => {
    it("exits exercise and switches tab immediately", () => {
      const onExitExercise = vi.fn();
      render(
        <EncoderSimulator
          selectedExercise={createGeneratedExercise(
            "base64",
            "encode",
            "Hello",
          )}
          onExitExercise={onExitExercise}
        />,
      );

      fireEvent.click(screen.getByTestId("encoding-tab-utf8"));

      expect(onExitExercise).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("mock-utf8-encoder")).toBeTruthy();
    });
  });

  describe("when exiting exercise mode", () => {
    it("calls onExitExercise callback", () => {
      const onExitExercise = vi.fn();
      render(
        <EncoderSimulator
          selectedExercise={createGeneratedExercise(
            "base64",
            "encode",
            "Hello",
          )}
          onExitExercise={onExitExercise}
        />,
      );

      fireEvent.click(screen.getByTestId("mock-base64-exit-exercise-button"));

      expect(onExitExercise).toHaveBeenCalledTimes(1);
    });
  });
});
