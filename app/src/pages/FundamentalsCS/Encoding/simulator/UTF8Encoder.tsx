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
  useToggleSet,
  ModeToggle,
  WarningBanner,
} from "@/components/shared/SimulatorShared";

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

interface Utf8DecodeStep {
  index: number;
  hexByte: string;
  binary: string;
  byteType: "lead" | "cont" | "single";
  byteCount: number;
}

interface Utf8DecodeCharStep {
  index: number;
  codePoint: number;
  codePointHex: string;
  char: string;
  bytesUsed: string[];
}

function getCodePoint(char: string): number {
  return char.codePointAt(0) ?? 0;
}

function getUtf8Bytes(codePoint: number): number[] {
  if (codePoint <= 0x7f) {
    return [codePoint];
  } else if (codePoint <= 0x7ff) {
    return [0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f)];
  } else if (codePoint <= 0xffff) {
    return [
      0xe0 | (codePoint >> 12),
      0x80 | ((codePoint >> 6) & 0x3f),
      0x80 | (codePoint & 0x3f),
    ];
  } else if (codePoint <= 0x10ffff) {
    return [
      0xf0 | (codePoint >> 18),
      0x80 | ((codePoint >> 12) & 0x3f),
      0x80 | ((codePoint >> 6) & 0x3f),
      0x80 | (codePoint & 0x3f),
    ];
  }
  return [];
}

function displayChar(char: string): string {
  const code = char.codePointAt(0) ?? 0;
  if (code < 0x20 || (code >= 0x7f && code < 0xa0)) {
    return `\\x${code.toString(16).toUpperCase().padStart(2, "0")}`;
  }
  return char;
}

function displayText(text: string): string {
  return Array.from(text).map(displayChar).join("");
}

interface Utf8BitSegment {
  type: "control" | "payload";
  bits: string;
}

function getUtf8BitSegments(
  binary: string,
  byteType: "single" | "lead" | "cont",
  byteCount: number,
): Utf8BitSegment[] {
  const controlLengths: Record<string, number> = {
    "1": 1,
    "2-lead": 3,
    "2-cont": 2,
    "3-lead": 4,
    "3-cont": 2,
    "4-lead": 5,
    "4-cont": 2,
  };
  const key = byteCount === 1 ? "1" : `${byteCount}-${byteType}`;
  const controlLen = controlLengths[key] ?? 0;
  const payloadLen = 8 - controlLen;
  return [
    { type: "control", bits: binary.slice(0, controlLen) },
    {
      type: "payload",
      bits: binary.slice(controlLen, controlLen + payloadLen),
    },
  ];
}

function Utf8BitDisplay({ segments }: { segments: Utf8BitSegment[] }) {
  return (
    <span className="font-mono">
      {segments.map((seg, i) => (
        <span
          key={i}
          className={
            seg.type === "control"
              ? "font-bold text-red-500 dark:text-red-400"
              : "text-blue-500 dark:text-blue-400"
          }
        >
          {seg.bits}
        </span>
      ))}
    </span>
  );
}

function getUtf8PatternDisplay(byteCount: number): React.ReactNode {
  const patterns: Record<number, { control: string; payload: string }[]> = {
    1: [{ control: "0", payload: "xxxxxxx" }],
    2: [
      { control: "110", payload: "xxxxx" },
      { control: "10", payload: "xxxxxx" },
    ],
    3: [
      { control: "1110", payload: "xxxx" },
      { control: "10", payload: "xxxxxx" },
      { control: "10", payload: "xxxxxx" },
    ],
    4: [
      { control: "11110", payload: "xxx" },
      { control: "10", payload: "xxxxxx" },
      { control: "10", payload: "xxxxxx" },
      { control: "10", payload: "xxxxxx" },
    ],
  };
  const bytes = patterns[byteCount] ?? [];
  return (
    <span className="font-mono">
      {bytes.map((b, i) => (
        <span key={i}>
          {i > 0 && <span className="text-muted-foreground"> </span>}
          <span className="font-bold text-red-500 dark:text-red-400">
            {b.control}
          </span>
          <span className="text-blue-500 dark:text-blue-400">{b.payload}</span>
        </span>
      ))}
    </span>
  );
}

function decodeUtf8(hexString: string): string {
  const hexBytes = hexString.trim().split(/\s+/);
  const bytes: number[] = [];
  for (const hex of hexBytes) {
    const val = parseInt(hex, 16);
    if (isNaN(val) || val > 0xff) return "";
    bytes.push(val);
  }
  let result = "";
  let i = 0;
  while (i < bytes.length) {
    const byte = bytes[i];
    let codePoint: number;
    if ((byte & 0x80) === 0) {
      codePoint = byte;
      i += 1;
    } else if ((byte & 0xe0) === 0xc0) {
      if (i + 1 >= bytes.length) return "";
      if ((bytes[i + 1] & 0xc0) !== 0x80) return "";
      codePoint = ((byte & 0x1f) << 6) | (bytes[i + 1] & 0x3f);
      if (codePoint < 0x80) return "";
      i += 2;
    } else if ((byte & 0xf0) === 0xe0) {
      if (i + 2 >= bytes.length) return "";
      if ((bytes[i + 1] & 0xc0) !== 0x80 || (bytes[i + 2] & 0xc0) !== 0x80)
        return "";
      codePoint =
        ((byte & 0x0f) << 12) |
        ((bytes[i + 1] & 0x3f) << 6) |
        (bytes[i + 2] & 0x3f);
      if (codePoint < 0x800) return "";
      i += 3;
    } else if ((byte & 0xf8) === 0xf0) {
      if (i + 3 >= bytes.length) return "";
      if (
        (bytes[i + 1] & 0xc0) !== 0x80 ||
        (bytes[i + 2] & 0xc0) !== 0x80 ||
        (bytes[i + 3] & 0xc0) !== 0x80
      )
        return "";
      codePoint =
        ((byte & 0x07) << 18) |
        ((bytes[i + 1] & 0x3f) << 12) |
        ((bytes[i + 2] & 0x3f) << 6) |
        (bytes[i + 3] & 0x3f);
      if (codePoint < 0x10000 || codePoint > 0x10ffff) return "";
      i += 4;
    } else {
      return "";
    }
    result += String.fromCodePoint(codePoint);
  }
  return result;
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
  const [inputValue, setInputValue] = useState(initialValue);
  const [converterMode, setConverterMode] = useState<"encode" | "decode">(
    initialConverterMode,
  );
  const { expanded, toggle } = useToggleSet(["0", "1", "2"]);

  useEffect(() => {
    onChangeState?.({ converterMode, inputValue });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [converterMode, inputValue]);

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

  const utf8DecodeByteSteps = useMemo((): Utf8DecodeStep[] => {
    const hexBytes =
      converterMode === "decode" && inputValue
        ? inputValue.trim().split(/\s+/)
        : [];
    const steps: Utf8DecodeStep[] = [];
    let expectedContinuations = 0;
    for (let i = 0; i < hexBytes.length; i++) {
      const val = parseInt(hexBytes[i], 16);
      if (isNaN(val) || val > 0xff) break;
      const binary = val.toString(2).padStart(8, "0");
      if (expectedContinuations > 0) {
        steps.push({
          index: i,
          hexByte: hexBytes[i].toUpperCase().padStart(2, "0"),
          binary,
          byteType: "cont",
          byteCount: 0,
        });
        expectedContinuations--;
      } else if ((val & 0x80) === 0) {
        steps.push({
          index: i,
          hexByte: hexBytes[i].toUpperCase().padStart(2, "0"),
          binary,
          byteType: "single",
          byteCount: 1,
        });
      } else if ((val & 0xe0) === 0xc0) {
        steps.push({
          index: i,
          hexByte: hexBytes[i].toUpperCase().padStart(2, "0"),
          binary,
          byteType: "lead",
          byteCount: 2,
        });
        expectedContinuations = 1;
      } else if ((val & 0xf0) === 0xe0) {
        steps.push({
          index: i,
          hexByte: hexBytes[i].toUpperCase().padStart(2, "0"),
          binary,
          byteType: "lead",
          byteCount: 3,
        });
        expectedContinuations = 2;
      } else if ((val & 0xf8) === 0xf0) {
        steps.push({
          index: i,
          hexByte: hexBytes[i].toUpperCase().padStart(2, "0"),
          binary,
          byteType: "lead",
          byteCount: 4,
        });
        expectedContinuations = 3;
      }
    }
    return steps;
  }, [inputValue, converterMode]);

  const utf8DecodeCharSteps = useMemo((): Utf8DecodeCharStep[] => {
    const hexBytes =
      converterMode === "decode" && inputValue
        ? inputValue.trim().split(/\s+/)
        : [];
    const bytes: number[] = [];
    let validInput = true;
    for (const hex of hexBytes) {
      const val = parseInt(hex, 16);
      if (isNaN(val) || val > 0xff) {
        validInput = false;
        break;
      }
      bytes.push(val);
    }
    if (!validInput || bytes.length === 0) return [];
    const steps: Utf8DecodeCharStep[] = [];
    let i = 0;
    while (i < bytes.length) {
      const byte = bytes[i];
      let codePoint: number;
      const bytesUsed: string[] = [];
      if ((byte & 0x80) === 0) {
        codePoint = byte;
        bytesUsed.push(bytes[i].toString(16).toUpperCase().padStart(2, "0"));
        i += 1;
      } else if ((byte & 0xe0) === 0xc0) {
        if (i + 1 >= bytes.length) break;
        if ((bytes[i + 1] & 0xc0) !== 0x80) break;
        codePoint = ((byte & 0x1f) << 6) | (bytes[i + 1] & 0x3f);
        if (codePoint < 0x80) break;
        bytesUsed.push(bytes[i].toString(16).toUpperCase().padStart(2, "0"));
        bytesUsed.push(
          bytes[i + 1].toString(16).toUpperCase().padStart(2, "0"),
        );
        i += 2;
      } else if ((byte & 0xf0) === 0xe0) {
        if (i + 2 >= bytes.length) break;
        if ((bytes[i + 1] & 0xc0) !== 0x80 || (bytes[i + 2] & 0xc0) !== 0x80)
          break;
        codePoint =
          ((byte & 0x0f) << 12) |
          ((bytes[i + 1] & 0x3f) << 6) |
          (bytes[i + 2] & 0x3f);
        if (codePoint < 0x800) break;
        bytesUsed.push(bytes[i].toString(16).toUpperCase().padStart(2, "0"));
        bytesUsed.push(
          bytes[i + 1].toString(16).toUpperCase().padStart(2, "0"),
        );
        bytesUsed.push(
          bytes[i + 2].toString(16).toUpperCase().padStart(2, "0"),
        );
        i += 3;
      } else if ((byte & 0xf8) === 0xf0) {
        if (i + 3 >= bytes.length) break;
        if (
          (bytes[i + 1] & 0xc0) !== 0x80 ||
          (bytes[i + 2] & 0xc0) !== 0x80 ||
          (bytes[i + 3] & 0xc0) !== 0x80
        )
          break;
        codePoint =
          ((byte & 0x07) << 18) |
          ((bytes[i + 1] & 0x3f) << 12) |
          ((bytes[i + 2] & 0x3f) << 6) |
          (bytes[i + 3] & 0x3f);
        if (codePoint < 0x10000 || codePoint > 0x10ffff) break;
        bytesUsed.push(bytes[i].toString(16).toUpperCase().padStart(2, "0"));
        bytesUsed.push(
          bytes[i + 1].toString(16).toUpperCase().padStart(2, "0"),
        );
        bytesUsed.push(
          bytes[i + 2].toString(16).toUpperCase().padStart(2, "0"),
        );
        bytesUsed.push(
          bytes[i + 3].toString(16).toUpperCase().padStart(2, "0"),
        );
        i += 4;
      } else {
        break;
      }
      steps.push({
        index: steps.length,
        codePoint,
        codePointHex: `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`,
        char: String.fromCodePoint(codePoint),
        bytesUsed,
      });
    }
    return steps;
  }, [inputValue, converterMode]);

  const result = useMemo(() => {
    if (converterMode === "encode") {
      if (!inputValue) return "";
      const allBytes: number[] = [];
      for (const char of Array.from(inputValue)) {
        const codePoint = getCodePoint(char);
        allBytes.push(...getUtf8Bytes(codePoint));
      }
      return allBytes
        .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
        .join(" ");
    } else {
      if (!inputValue) return "";
      return decodeUtf8(inputValue);
    }
  }, [inputValue, converterMode]);

  const expectedResults = useMemo(() => [result], [result]);

  const inputMode: ValidationInputMode =
    converterMode === "encode" ? "hex-bytes" : "text";

  const inputLabel =
    converterMode === "encode"
      ? t("simulator.encoding.inputText")
      : t("simulator.encoding.inputHexBytes");

  const resultLabel =
    converterMode === "encode"
      ? t("simulator.encoding.utf8Result")
      : t("simulator.encoding.decodedResult");

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
      const formatted = pairs.join(" ");
      setInputValue(formatted);
    }
  };

  const handleModeChange = (mode: "encode" | "decode") => {
    if (isExerciseMode) return;
    setConverterMode(mode);
    setInputValue("");
  };

  return (
    <SimulatorLayout
      inputPanel={
        <div className="space-y-4">
          <div className="mb-2 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-foreground flex items-center gap-2 text-lg font-semibold">
                <Globe className="text-primary h-5 w-5" />
                {t("simulator.encoding.utf8Title")}
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("simulator.encoding.utf8Desc")}
              </p>
            </div>

            <ModeToggle
              value={converterMode}
              onChange={handleModeChange}
              options={[
                {
                  value: "encode",
                  label: t("simulator.encoding.encode"),
                },
                {
                  value: "decode",
                  label: t("simulator.encoding.decode"),
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
              title={t("simulator.encoding.explanation")}
            />

            {!inputValue && (
              <p className="text-muted-foreground text-sm">
                {t("simulator.encoding.enterValue")}
              </p>
            )}

            {inputValue && converterMode === "encode" && (
              <div className="space-y-4">
                <StepByStepToggle
                  open={expanded.has("0")}
                  onToggle={() => toggle("0")}
                />

                {expanded.has("0") && (
                  <div className="space-y-2">
                    <h4 className="text-foreground text-sm font-medium">
                      {t("simulator.encoding.step1CodePoint")}
                    </h4>
                    {charSteps.map((step) => (
                      <CollapsibleStep
                        key={step.index}
                        isOpen={expanded.has(`char-${step.index}`)}
                        onToggle={() => toggle(`char-${step.index}`)}
                        header={
                          <span className="font-mono text-sm">
                            '{step.char}' → {step.codePointHex} (
                            {step.byteCount}{" "}
                            {t("simulator.encoding.byteLabel", {
                              count: step.byteCount,
                            })}
                            )
                          </span>
                        }
                      >
                        <div className="space-y-1 text-sm">
                          <p>
                            {t("simulator.encoding.charLabel")}:{" "}
                            <code className="font-mono">{step.char}</code>
                          </p>
                          <p>
                            {t("simulator.encoding.codePointLabel")}:{" "}
                            <code className="font-mono">
                              {step.codePointHex}
                            </code>
                          </p>
                          <p>
                            {t("simulator.encoding.decimalLabel")}:{" "}
                            <code className="font-mono">{step.codePoint}</code>
                          </p>
                          <p>
                            {t("simulator.encoding.bytePattern")}:{" "}
                            {getUtf8PatternDisplay(step.byteCount)}
                          </p>
                        </div>
                      </CollapsibleStep>
                    ))}
                  </div>
                )}

                <StepByStepToggle
                  open={expanded.has("1")}
                  onToggle={() => toggle("1")}
                />

                {expanded.has("1") && (
                  <div className="space-y-2">
                    <h4 className="text-foreground text-sm font-medium">
                      {t("simulator.encoding.step2ByteEncoding")}
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
                                  {t("simulator.encoding.byteN", {
                                    n: bi + 1,
                                  })}
                                  {step.byteCount > 1 && (
                                    <span className="text-muted-foreground ml-2 text-xs">
                                      (
                                      {byteType === "lead"
                                        ? t("simulator.encoding.leadByte", {
                                            count: step.byteCount,
                                          })
                                        : t(
                                            "simulator.encoding.continuationByte",
                                          )}
                                      )
                                    </span>
                                  )}
                                </p>
                                <p>
                                  {t("simulator.encoding.hexLabel")}:{" "}
                                  <code className="font-mono">
                                    {step.bytesHex[bi]}
                                  </code>
                                </p>
                                <p>
                                  {t("simulator.encoding.binaryLabel")}:{" "}
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

                <StepByStepToggle
                  open={expanded.has("2")}
                  onToggle={() => toggle("2")}
                />

                {expanded.has("2") && (
                  <div className="space-y-2">
                    <h4 className="text-foreground text-sm font-medium">
                      {t("simulator.encoding.step3FullSequence")}
                    </h4>
                    <div className="bg-muted/30 rounded-lg p-3 font-mono text-xs">
                      <p className="text-muted-foreground mb-1">
                        {t("simulator.encoding.hexSequence")}:
                      </p>
                      <p className="break-all">{result}</p>
                      <p className="text-muted-foreground mt-3 mb-1">
                        {t("simulator.encoding.binarySequence")}:
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
                                  <span className="text-muted-foreground">
                                    {" "}
                                  </span>
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
                      {t("simulator.encoding.finalResult")}
                    </p>
                    <code className="text-primary mt-1 block font-mono text-lg break-all">
                      {result}
                    </code>
                  </div>
                )}
              </div>
            )}

            {inputValue && converterMode === "decode" && (
              <div className="space-y-4">
                <StepByStepToggle
                  open={expanded.has("0")}
                  onToggle={() => toggle("0")}
                />

                {expanded.has("0") && (
                  <div className="space-y-2">
                    <h4 className="text-foreground text-sm font-medium">
                      {t("simulator.encoding.decodeStep1Bytes")}
                    </h4>
                    {utf8DecodeByteSteps.map((step) => (
                      <CollapsibleStep
                        key={step.index}
                        isOpen={expanded.has(`utf8byte-${step.index}`)}
                        onToggle={() => toggle(`utf8byte-${step.index}`)}
                        header={
                          <span className="font-mono text-sm">
                            {step.hexByte} ({step.binary}){" "}
                            {step.byteType === "lead"
                              ? `→ ${t("simulator.encoding.leadByte", { count: step.byteCount })}`
                              : step.byteType === "cont"
                                ? `→ ${t("simulator.encoding.continuationByte")}`
                                : `→ ${t("simulator.encoding.singleByte")}`}
                          </span>
                        }
                      >
                        <div className="space-y-1 text-sm">
                          <p>
                            {t("simulator.encoding.hexLabel")}:{" "}
                            <code className="font-mono">{step.hexByte}</code>
                          </p>
                          <p>
                            {t("simulator.encoding.binaryLabel")}:{" "}
                            <Utf8BitDisplay
                              segments={getUtf8BitSegments(
                                step.binary,
                                step.byteType,
                                step.byteType === "lead" ? step.byteCount : 1,
                              )}
                            />
                          </p>
                          <p>
                            {t("simulator.encoding.byteTypeLabel")}:{" "}
                            <code className="font-mono">
                              {step.byteType === "lead"
                                ? t("simulator.encoding.leadByte", {
                                    count: step.byteCount,
                                  })
                                : step.byteType === "cont"
                                  ? t("simulator.encoding.continuationByte")
                                  : t("simulator.encoding.singleByte")}
                            </code>
                          </p>
                        </div>
                      </CollapsibleStep>
                    ))}
                  </div>
                )}

                <StepByStepToggle
                  open={expanded.has("1")}
                  onToggle={() => toggle("1")}
                />

                {expanded.has("1") && (
                  <div className="space-y-2">
                    <h4 className="text-foreground text-sm font-medium">
                      {t("simulator.encoding.decodeStep2CodePoints")}
                    </h4>
                    {utf8DecodeCharSteps.map((step) => (
                      <CollapsibleStep
                        key={step.index}
                        isOpen={expanded.has(`utf8char-${step.index}`)}
                        onToggle={() => toggle(`utf8char-${step.index}`)}
                        header={
                          <span className="font-mono text-sm">
                            {step.bytesUsed.join(" ")} → '{step.char}' (
                            {step.codePointHex})
                          </span>
                        }
                      >
                        <div className="space-y-1 text-sm">
                          <p>
                            {t("simulator.encoding.bytesUsed")}:{" "}
                            <code className="font-mono">
                              {step.bytesUsed.join(" ")}
                            </code>
                          </p>
                          <p>
                            {t("simulator.encoding.codePointLabel")}:{" "}
                            <code className="font-mono">
                              {step.codePointHex}
                            </code>
                          </p>
                          <p>
                            {t("simulator.encoding.decimalLabel")}:{" "}
                            <code className="font-mono">{step.codePoint}</code>
                          </p>
                          <p>
                            {t("simulator.encoding.charLabel")}:{" "}
                            <code className="font-mono">
                              {displayChar(step.char)}
                            </code>
                          </p>
                        </div>
                      </CollapsibleStep>
                    ))}
                  </div>
                )}

                <StepByStepToggle
                  open={expanded.has("2")}
                  onToggle={() => toggle("2")}
                />

                {expanded.has("2") && (
                  <div className="space-y-2">
                    <h4 className="text-foreground text-sm font-medium">
                      {t("simulator.encoding.decodeStep3FullText")}
                    </h4>
                    <div className="bg-muted/30 rounded-lg p-3 font-mono text-xs">
                      <p className="text-muted-foreground mb-1">
                        {t("simulator.encoding.decodedResult")}:
                      </p>
                      <p className="text-base break-all">
                        {displayText(result)}
                      </p>
                    </div>
                  </div>
                )}

                {inputValue.trim().length > 0 && !result && (
                  <WarningBanner
                    variant="warning"
                    title={t(
                      "simulator.encoding.invalidUtf8Title",
                      "Invalid UTF-8 Sequence",
                    )}
                  >
                    {t(
                      "simulator.encoding.invalidUtf8Desc",
                      "The hex bytes do not form a valid UTF-8 sequence. Check your input and try again.",
                    )}
                  </WarningBanner>
                )}

                {result && (
                  <div className="bg-primary/10 mt-4 rounded-lg p-4">
                    <p className="text-sm font-medium">
                      {t("simulator.encoding.finalResult")}
                    </p>
                    <code className="text-primary mt-1 block font-mono text-lg break-all">
                      {displayText(result)}
                    </code>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      }
    />
  );
}
