import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Info } from "lucide-react";
import { ExerciseValidationPanel } from "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel";
import type { ValidationInputMode } from "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel";
import {
  SimulatorLayout,
  BinaryInput,
  StepByStepToggle,
  CollapsibleStep,
  ResultSectionHeader,
  WarningBanner,
  ModeToggle,
  useToggleSet,
} from "@/components/shared/SimulatorShared";
import { StepByStepSection } from "./StepByStepSection";
import { Utf8BitDisplay } from "./Utf8BitDisplay";
import {
  getCodePoint,
  getUtf8Bytes,
  getUtf8BitSegments,
  getUtf8PatternDisplay,
  getUtf8DecodeByteSteps,
  getUtf8DecodeCharSteps,
  encodeUtf8ToHex,
  decodeUtf8,
  displayChar,
  displayText,
} from "../utils/utf8Utils";

interface UTF8EncoderProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  onExitExercise?: () => void;
  initialValue?: string;
  initialConverterMode?: "encode" | "decode";
  expectedAnswer?: string;
  onChangeState?: (state: {
    converterMode: "encode" | "decode";
    inputValue: string;
  }) => void;
}

interface CharEncodingStep {
  index: number;
  char: string;
  codePoint: number;
  codePointHex: string;
  byteCount: number;
  bytes: number[];
  bytesHex: string[];
  bytesBinary: string[];
}

function useUtf8EncoderState(
  initialValue: string,
  initialConverterMode: "encode" | "decode",
  isExerciseMode: boolean,
  showSolution: boolean,
  onChangeState?: UTF8EncoderProps["onChangeState"],
) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [converterMode, setConverterMode] = useState<"encode" | "decode">(
    initialConverterMode,
  );

  useEffect(() => {
    onChangeState?.({ converterMode, inputValue });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [converterMode, inputValue]);

  const handleInputChange = (v: string) => {
    if (isExerciseMode && !showSolution) return;
    if (converterMode === "encode") {
      setInputValue(v);
    } else {
      const hexOnly = v.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
      const pairs: string[] = [];
      for (let i = 0; i < hexOnly.length; i += 2) {
        pairs.push(hexOnly.slice(i, i + 2));
      }
      setInputValue(pairs.join(" "));
    }
  };

  const handleModeChange = (mode: "encode" | "decode") => {
    if (isExerciseMode) return;
    setConverterMode(mode);
    setInputValue("");
  };

  return {
    inputValue,
    converterMode,
    handleInputChange,
    handleModeChange,
  };
}

interface EncodeResultPanelProps {
  charSteps: CharEncodingStep[];
  result: string;
  expanded: Set<string>;
  toggle: (key: string) => void;
}

function EncodeResultPanel({
  charSteps,
  result,
  expanded,
  toggle,
}: EncodeResultPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <StepByStepToggle open={expanded.has("0")} onToggle={() => toggle("0")} />

      {expanded.has("0") && (
        <div className="space-y-2">
          <h4 className="text-foreground text-sm font-medium">
            {t("encoding.simulator.step1CodePoint")}
          </h4>
          {charSteps.map((step) => (
            <CollapsibleStep
              key={step.index}
              isOpen={expanded.has(`char-${step.index}`)}
              onToggle={() => toggle(`char-${step.index}`)}
              header={
                <span className="font-mono text-sm">
                  '{step.char}' → {step.codePointHex} ({step.byteCount}{" "}
                  {t("encoding.simulator.byteLabel", {
                    count: step.byteCount,
                  })}
                  )
                </span>
              }
            >
              <div className="space-y-1 text-sm">
                <p>
                  {t("encoding.simulator.charLabel")}:{" "}
                  <code className="font-mono">{step.char}</code>
                </p>
                <p>
                  {t("encoding.simulator.codePointLabel")}:{" "}
                  <code className="font-mono">{step.codePointHex}</code>
                </p>
                <p>
                  {t("encoding.simulator.decimalLabel")}:{" "}
                  <code className="font-mono">{step.codePoint}</code>
                </p>
                <p>
                  {t("encoding.simulator.bytePattern")}:{" "}
                  {getUtf8PatternDisplay(step.byteCount)}
                </p>
              </div>
            </CollapsibleStep>
          ))}
        </div>
      )}

      <StepByStepToggle open={expanded.has("1")} onToggle={() => toggle("1")} />

      {expanded.has("1") && (
        <div className="space-y-2">
          <h4 className="text-foreground text-sm font-medium">
            {t("encoding.simulator.step2ByteEncoding")}
          </h4>
          {charSteps.map((step) => (
            <CollapsibleStep
              key={`bytes-${step.index}`}
              isOpen={expanded.has(`bytes-${step.index}`)}
              onToggle={() => toggle(`bytes-${step.index}`)}
              header={
                <span className="font-mono text-sm">
                  '{step.char}' → {step.bytesHex.join(" ")}
                </span>
              }
            >
              <div className="space-y-2 text-sm">
                {step.bytes.map((_byte, bi) => {
                  const byteType =
                    bi === 0
                      ? step.byteCount === 1
                        ? "single"
                        : "lead"
                      : "cont";
                  const segments = getUtf8BitSegments(
                    step.bytesBinary[bi],
                    byteType,
                    step.byteCount,
                  );
                  return (
                    <div key={bi} className="space-y-1">
                      <p className="font-medium">
                        {t("encoding.simulator.byteN", { n: bi + 1 })}
                        {step.byteCount > 1 && (
                          <span className="text-muted-foreground ml-2 text-xs">
                            (
                            {byteType === "lead"
                              ? t("encoding.simulator.leadByte", {
                                  count: step.byteCount,
                                })
                              : t("encoding.simulator.continuationByte")}
                            )
                          </span>
                        )}
                      </p>
                      <p>
                        {t("encoding.simulator.hexLabel")}:{" "}
                        <code className="font-mono">{step.bytesHex[bi]}</code>
                      </p>
                      <p>
                        {t("encoding.simulator.binaryLabel")}:{" "}
                        <Utf8BitDisplay segments={segments} />
                      </p>
                    </div>
                  );
                })}
              </div>
            </CollapsibleStep>
          ))}
        </div>
      )}

      <StepByStepToggle open={expanded.has("2")} onToggle={() => toggle("2")} />

      {expanded.has("2") && (
        <div className="space-y-2">
          <h4 className="text-foreground text-sm font-medium">
            {t("encoding.simulator.step3FullSequence")}
          </h4>
          <div className="bg-muted/30 rounded-lg p-3 font-mono text-xs">
            <p className="text-muted-foreground mb-1">
              {t("encoding.simulator.hexSequence")}:
            </p>
            <p className="break-all">{result}</p>
            <p className="text-muted-foreground mt-3 mb-1">
              {t("encoding.simulator.binarySequence")}:
            </p>
            <div className="flex flex-wrap gap-1 break-all">
              {charSteps.map((step) =>
                step.bytesBinary.map((binary, bi) => {
                  const byteType =
                    bi === 0
                      ? step.byteCount === 1
                        ? "single"
                        : "lead"
                      : "cont";
                  const segments = getUtf8BitSegments(
                    binary,
                    byteType,
                    step.byteCount,
                  );
                  return (
                    <span key={`${step.index}-${bi}`}>
                      {bi > 0 && (
                        <span className="text-muted-foreground"> </span>
                      )}
                      <Utf8BitDisplay segments={segments} />
                    </span>
                  );
                }),
              )}
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-primary/10 mt-4 rounded-lg p-4">
          <p className="text-sm font-medium">
            {t("encoding.simulator.finalResult")}
          </p>
          <code className="text-primary mt-1 block font-mono text-lg break-all">
            {result}
          </code>
        </div>
      )}
    </div>
  );
}

interface DecodeResultPanelProps {
  byteSteps: ReturnType<typeof getUtf8DecodeByteSteps>;
  charSteps: ReturnType<typeof getUtf8DecodeCharSteps>;
  result: string;
  expanded: Set<string>;
  toggle: (key: string) => void;
}

function DecodeResultPanel({
  byteSteps,
  charSteps,
  result,
  expanded,
  toggle,
}: DecodeResultPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <StepByStepToggle open={expanded.has("0")} onToggle={() => toggle("0")} />

      {expanded.has("0") && (
        <div className="space-y-2">
          <h4 className="text-foreground text-sm font-medium">
            {t("encoding.simulator.decodeStep1Bytes")}
          </h4>
          {byteSteps.map((step) => (
            <CollapsibleStep
              key={step.index}
              isOpen={expanded.has(`utf8byte-${step.index}`)}
              onToggle={() => toggle(`utf8byte-${step.index}`)}
              header={
                <span className="font-mono text-sm">
                  {step.hexByte} ({step.binary}){" "}
                  {step.byteType === "lead"
                    ? `→ ${t("encoding.simulator.leadByte", { count: step.byteCount })}`
                    : step.byteType === "cont"
                      ? `→ ${t("encoding.simulator.continuationByte")}`
                      : `→ ${t("encoding.simulator.singleByte")}`}
                </span>
              }
            >
              <div className="space-y-1 text-sm">
                <p>
                  {t("encoding.simulator.hexLabel")}:{" "}
                  <code className="font-mono">{step.hexByte}</code>
                </p>
                <p>
                  {t("encoding.simulator.binaryLabel")}:{" "}
                  <Utf8BitDisplay
                    segments={getUtf8BitSegments(
                      step.binary,
                      step.byteType,
                      step.byteType === "lead" ? step.byteCount : 1,
                    )}
                  />
                </p>
                <p>
                  {t("encoding.simulator.byteTypeLabel")}:{" "}
                  <code className="font-mono">
                    {step.byteType === "lead"
                      ? t("encoding.simulator.leadByte", {
                          count: step.byteCount,
                        })
                      : step.byteType === "cont"
                        ? t("encoding.simulator.continuationByte")
                        : t("encoding.simulator.singleByte")}
                  </code>
                </p>
              </div>
            </CollapsibleStep>
          ))}
        </div>
      )}

      <StepByStepSection
        open={expanded.has("1")}
        onToggle={() => toggle("1")}
        title={t("encoding.simulator.decodeStep2CodePoints")}
      >
        {charSteps.map((step) => (
          <CollapsibleStep
            key={step.index}
            isOpen={expanded.has(`utf8char-${step.index}`)}
            onToggle={() => toggle(`utf8char-${step.index}`)}
            header={
              <span className="font-mono text-sm">
                {step.bytesUsed.join(" ")} → '{step.char}' ({step.codePointHex})
              </span>
            }
          >
            <div className="space-y-1 text-sm">
              <p>
                {t("encoding.simulator.bytesUsed")}:{" "}
                <code className="font-mono">{step.bytesUsed.join(" ")}</code>
              </p>
              <p>
                {t("encoding.simulator.codePointLabel")}:{" "}
                <code className="font-mono">{step.codePointHex}</code>
              </p>
              <p>
                {t("encoding.simulator.decimalLabel")}:{" "}
                <code className="font-mono">{step.codePoint}</code>
              </p>
              <p>
                {t("encoding.simulator.charLabel")}:{" "}
                <code className="font-mono">{displayChar(step.char)}</code>
              </p>
            </div>
          </CollapsibleStep>
        ))}
      </StepByStepSection>

      <StepByStepSection
        open={expanded.has("2")}
        onToggle={() => toggle("2")}
        title={t("encoding.simulator.decodeStep3FullText")}
      >
        <div className="bg-muted/30 rounded-lg p-3 font-mono text-xs">
          <p className="text-muted-foreground mb-1">
            {t("encoding.simulator.decodedResult")}:
          </p>
          <p className="text-base break-all">{displayText(result)}</p>
        </div>
      </StepByStepSection>

      <DecodeWarningAndFinalResult result={result} />
    </div>
  );
}

interface DecodeWarningAndFinalResultProps {
  result: string;
}

function DecodeWarningAndFinalResult({
  result,
}: DecodeWarningAndFinalResultProps) {
  const { t } = useTranslation();
  return (
    <>
      {!result && (
        <WarningBanner
          variant="warning"
          title={t(
            "encoding.simulator.invalidUtf8Title",
            "Invalid UTF-8 Sequence",
          )}
        >
          {t(
            "encoding.simulator.invalidUtf8Desc",
            "The hex bytes do not form a valid UTF-8 sequence. Check your input and try again.",
          )}
        </WarningBanner>
      )}

      {result && (
        <div className="bg-primary/10 mt-4 rounded-lg p-4">
          <p className="text-sm font-medium">
            {t("encoding.simulator.finalResult")}
          </p>
          <code className="text-primary mt-1 block font-mono text-lg break-all">
            {displayText(result)}
          </code>
        </div>
      )}
    </>
  );
}

export function UTF8Encoder({
  isExerciseMode = false,
  showSolution = true,
  onShowSolution,
  onExitExercise,
  initialValue = "",
  initialConverterMode = "encode",
  expectedAnswer,
  onChangeState,
}: UTF8EncoderProps) {
  const { t } = useTranslation();
  const { inputValue, converterMode, handleInputChange, handleModeChange } =
    useUtf8EncoderState(
      initialValue,
      initialConverterMode,
      isExerciseMode,
      showSolution,
      onChangeState,
    );
  const { expanded, toggle } = useToggleSet(["0", "1", "2"]);

  const charSteps = useMemo((): CharEncodingStep[] => {
    if (converterMode !== "encode" || !inputValue) return [];
    return Array.from(inputValue).map((char, i) => {
      const codePoint = getCodePoint(char);
      const bytes = getUtf8Bytes(codePoint);
      return {
        index: i,
        char,
        codePoint,
        codePointHex: `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`,
        byteCount: bytes.length,
        bytes,
        bytesHex: bytes.map((b) =>
          b.toString(16).toUpperCase().padStart(2, "0"),
        ),
        bytesBinary: bytes.map((b) => b.toString(2).padStart(8, "0")),
      };
    });
  }, [inputValue, converterMode]);

  const utf8DecodeByteSteps = useMemo(() => {
    if (converterMode !== "decode" || !inputValue) return [];
    return getUtf8DecodeByteSteps(inputValue);
  }, [inputValue, converterMode]);

  const utf8DecodeCharSteps = useMemo(() => {
    if (converterMode !== "decode" || !inputValue) return [];
    return getUtf8DecodeCharSteps(inputValue);
  }, [inputValue, converterMode]);

  const result = useMemo(() => {
    if (!inputValue) return "";
    return converterMode === "encode"
      ? encodeUtf8ToHex(inputValue)
      : decodeUtf8(inputValue);
  }, [inputValue, converterMode]);

  const expectedResults = useMemo(() => [result], [result]);

  const inputMode: ValidationInputMode =
    converterMode === "encode" ? "hex-bytes" : "text";

  const inputLabel =
    converterMode === "encode"
      ? t("encoding.simulator.inputText")
      : t("encoding.simulator.inputHexBytes");

  const resultLabel =
    converterMode === "encode"
      ? t("encoding.simulator.utf8Result")
      : t("encoding.simulator.decodedResult");

  return (
    <SimulatorLayout
      inputPanel={
        <div className="space-y-4">
          <div className="mb-2 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-foreground flex items-center gap-2 text-lg font-semibold">
                <Globe className="text-primary h-5 w-5" />
                {t("encoding.simulator.utf8Title")}
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("encoding.simulator.utf8Desc")}
              </p>
            </div>

            <ModeToggle
              value={converterMode}
              onChange={handleModeChange}
              options={[
                {
                  value: "encode",
                  label: t("encoding.simulator.encode"),
                },
                {
                  value: "decode",
                  label: t("encoding.simulator.decode"),
                },
              ]}
              disabled={isExerciseMode}
            />
          </div>

          <BinaryInput
            data-testid="utf8-input"
            label={inputLabel}
            value={inputValue}
            onChange={handleInputChange}
            locked={isExerciseMode && !showSolution}
          />

          {showSolution && result && (
            <div className="bg-muted/50 rounded-lg p-4">
              <span className="text-muted-foreground text-xs font-medium">
                {resultLabel}
              </span>
              <div
                data-testid={
                  converterMode === "encode"
                    ? "utf8-result-hex"
                    : "utf8-result-ascii"
                }
                className="bg-background mt-2 rounded-md border px-3 py-2 font-mono text-sm break-all"
              >
                {result}
              </div>
            </div>
          )}
        </div>
      }
      resultPanel={
        isExerciseMode && !showSolution ? (
          <ExerciseValidationPanel
            expectedResult={expectedAnswer || expectedResults}
            onShowSolution={onShowSolution!}
            onExitExercise={onExitExercise}
            inputMode={inputMode}
            placeholder={
              converterMode === "encode" ? "48 65 6C 6C 6F" : "Hello"
            }
          />
        ) : (
          <div className="space-y-4">
            <ResultSectionHeader
              icon={<Info className="text-primary h-5 w-5" />}
              title={t("encoding.simulator.explanation")}
            />

            {!inputValue && (
              <p className="text-muted-foreground text-sm">
                {t("encoding.simulator.enterValue")}
              </p>
            )}

            {inputValue && converterMode === "encode" && (
              <EncodeResultPanel
                charSteps={charSteps}
                result={result}
                expanded={expanded}
                toggle={toggle}
              />
            )}

            {inputValue && converterMode === "decode" && (
              <DecodeResultPanel
                byteSteps={utf8DecodeByteSteps}
                charSteps={utf8DecodeCharSteps}
                result={result}
                expanded={expanded}
                toggle={toggle}
              />
            )}
          </div>
        )
      }
    />
  );
}
