import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Info } from "lucide-react";
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

const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

interface Base64EncoderProps {
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

interface EncodingStep {
  index: number;
  char: string;
  ascii: number;
  hex: string;
  binary: string;
}

interface GroupStep {
  index: number;
  bits: string;
  decimal: number;
  base64Char: string;
}

interface DecodeStep {
  index: number;
  base64Char: string;
  decimal: number;
  bits: string;
}

interface DecodeByteStep {
  index: number;
  bits: string;
  decimal: number;
  char: string;
}

export function Base64Encoder({
  isExerciseMode = false,
  showSolution = true,
  onShowSolution,
  onExitExercise,
  initialValue = "",
  initialConverterMode = "encode",
  expectedAnswer,
  onChangeState,
}: Base64EncoderProps) {
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

  const encodingSteps = useMemo((): EncodingStep[] => {
    if (converterMode !== "encode" || !inputValue) return [];
    return Array.from(inputValue).map((char, i) => ({
      index: i,
      char,
      ascii: char.charCodeAt(0),
      hex: char.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"),
      binary: char.charCodeAt(0).toString(2).padStart(8, "0"),
    }));
  }, [inputValue, converterMode]);

  const groupSteps = useMemo((): GroupStep[] => {
    if (converterMode !== "encode" || !inputValue) return [];
    const binaryString = Array.from(inputValue)
      .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
      .join("");
    const padded = binaryString.padEnd(
      Math.ceil(binaryString.length / 6) * 6,
      "0",
    );
    const groups: GroupStep[] = [];
    for (let i = 0; i < padded.length; i += 6) {
      const bits = padded.slice(i, i + 6);
      const decimal = parseInt(bits, 2);
      groups.push({
        index: groups.length,
        bits,
        decimal,
        base64Char: BASE64_CHARS[decimal],
      });
    }
    const paddingCount = (4 - (groups.length % 4)) % 4;
    for (let i = 0; i < paddingCount; i++) {
      groups.push({
        index: groups.length,
        bits: "======",
        decimal: -1,
        base64Char: "=",
      });
    }
    return groups;
  }, [inputValue, converterMode]);

  const decodeSteps = useMemo((): DecodeStep[] => {
    const clean =
      converterMode === "decode" && inputValue
        ? inputValue.replace(/=/g, "")
        : "";
    const steps: DecodeStep[] = [];
    for (const char of clean) {
      const idx = BASE64_CHARS.indexOf(char);
      if (idx === -1) break;
      steps.push({
        index: steps.length,
        base64Char: char,
        decimal: idx,
        bits: idx.toString(2).padStart(6, "0"),
      });
    }
    return steps;
  }, [inputValue, converterMode]);

  const decodeByteSteps = useMemo((): DecodeByteStep[] => {
    const clean =
      converterMode === "decode" && inputValue
        ? inputValue.replace(/=/g, "")
        : "";
    let binaryString = "";
    let valid = true;
    for (const char of clean) {
      const idx = BASE64_CHARS.indexOf(char);
      if (idx === -1) {
        valid = false;
        break;
      }
      binaryString += idx.toString(2).padStart(6, "0");
    }
    if (!valid) return [];
    const steps: DecodeByteStep[] = [];
    for (let i = 0; i < binaryString.length; i += 8) {
      const bits = binaryString.slice(i, i + 8);
      if (bits.length < 8) break;
      const decimal = parseInt(bits, 2);
      steps.push({
        index: steps.length,
        bits,
        decimal,
        char: String.fromCharCode(decimal),
      });
    }
    return steps;
  }, [inputValue, converterMode]);

  const result = useMemo(() => {
    if (converterMode === "encode") {
      if (!inputValue) return "";
      const binaryString = Array.from(inputValue)
        .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
        .join("");
      const padded = binaryString.padEnd(
        Math.ceil(binaryString.length / 6) * 6,
        "0",
      );
      let encoded = "";
      for (let i = 0; i < padded.length; i += 6) {
        const bits = padded.slice(i, i + 6);
        encoded += BASE64_CHARS[parseInt(bits, 2)];
      }
      const paddingCount = (4 - (encoded.length % 4)) % 4;
      return encoded + "=".repeat(paddingCount);
    } else {
      if (!inputValue) return "";
      const clean = inputValue.replace(/=/g, "");
      let binaryString = "";
      for (const char of clean) {
        const idx = BASE64_CHARS.indexOf(char);
        if (idx === -1) return "";
        binaryString += idx.toString(2).padStart(6, "0");
      }
      let decoded = "";
      for (let i = 0; i < binaryString.length; i += 8) {
        const byte = binaryString.slice(i, i + 8);
        if (byte.length < 8) break;
        decoded += String.fromCharCode(parseInt(byte, 2));
      }
      return decoded;
    }
  }, [inputValue, converterMode]);

  const expectedResults = useMemo(() => {
    if (converterMode === "encode") {
      return [result];
    } else {
      return [result];
    }
  }, [result, converterMode]);

  const inputMode: ValidationInputMode =
    converterMode === "encode" ? "base64" : "text";

  const inputLabel =
    converterMode === "encode"
      ? t("encoding.simulator.inputText")
      : t("encoding.simulator.inputBase64");

  const resultLabel =
    converterMode === "encode"
      ? t("encoding.simulator.base64Result")
      : t("encoding.simulator.decodedResult");

  const handleInputChange = (v: string) => {
    if (isExerciseMode && !showSolution) return;
    if (converterMode === "encode") {
      setInputValue(v);
    } else {
      setInputValue(v.replace(/[^A-Za-z0-9+/=]/g, ""));
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
                <FileText className="text-primary h-5 w-5" />
                {t("encoding.simulator.base64Title")}
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("encoding.simulator.base64Desc")}
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
            data-testid="base64-input"
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
                data-testid="base64-result"
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
            placeholder={converterMode === "encode" ? "SGVsbG8=" : "Hello"}
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
              <div className="space-y-4">
                <StepByStepToggle
                  open={expanded.has("0")}
                  onToggle={() => toggle("0")}
                />

                {expanded.has("0") && (
                  <div className="space-y-2">
                    <h4 className="text-foreground text-sm font-medium">
                      {t("encoding.simulator.step1CharToAscii")}
                    </h4>
                    {encodingSteps.map((step) => (
                      <CollapsibleStep
                        key={step.index}
                        isOpen={expanded.has(`char-${step.index}`)}
                        onToggle={() => toggle(`char-${step.index}`)}
                        header={
                          <span className="font-mono text-sm">
                            '{step.char}' → {step.ascii} ({step.hex}) →{" "}
                            {step.binary}
                          </span>
                        }
                      >
                        <div className="space-y-1 text-sm">
                          <p>
                            {t("encoding.simulator.charLabel")}:{" "}
                            <code className="font-mono">{step.char}</code>
                          </p>
                          <p>
                            {t("encoding.simulator.asciiLabel")}:{" "}
                            <code className="font-mono">{step.ascii}</code>
                            <span className="text-muted-foreground ml-2">
                              (Hex:{" "}
                              <code className="font-mono">{step.hex}</code>)
                            </span>
                          </p>
                          <p>
                            {t("encoding.simulator.binaryLabel")}:{" "}
                            <code className="font-mono">{step.binary}</code>
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
                      {t("encoding.simulator.step2GroupBits")}
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-muted-foreground mb-1 text-xs">
                          {t("encoding.simulator.asciiHexLabel")}:
                        </p>
                        <div className="bg-muted/30 rounded-lg p-3 font-mono text-xs break-all">
                          {encodingSteps.map((s) => s.hex).join(" ")}
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1 text-xs">
                          {t("encoding.simulator.binaryConcatLabel")}:
                        </p>
                        <div className="bg-muted/30 rounded-lg p-3 font-mono text-xs break-all">
                          {encodingSteps.map((s) => s.binary).join("")}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <StepByStepToggle
                  open={expanded.has("2")}
                  onToggle={() => toggle("2")}
                />

                {expanded.has("2") && (
                  <div className="space-y-2">
                    <h4 className="text-foreground text-sm font-medium">
                      {t("encoding.simulator.step3Base64Lookup")}
                    </h4>
                    {groupSteps.map((step) => (
                      <CollapsibleStep
                        key={step.index}
                        isOpen={expanded.has(`group-${step.index}`)}
                        onToggle={() => toggle(`group-${step.index}`)}
                        header={
                          <span className="font-mono text-sm">
                            {step.bits} → {step.base64Char}
                          </span>
                        }
                      >
                        <div className="space-y-1 text-sm">
                          <p>
                            {t("encoding.simulator.bitsLabel")}:{" "}
                            <code className="font-mono">{step.bits}</code>
                          </p>
                          <p>
                            {t("encoding.simulator.decimalLabel")}:{" "}
                            <code className="font-mono">
                              {step.decimal >= 0 ? step.decimal : "padding"}
                            </code>
                          </p>
                          <p>
                            {t("encoding.simulator.base64CharLabel")}:{" "}
                            <code className="font-mono">{step.base64Char}</code>
                          </p>
                        </div>
                      </CollapsibleStep>
                    ))}
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
                      {t("encoding.simulator.decodeStep1Lookup")}
                    </h4>
                    {decodeSteps.map((step) => (
                      <CollapsibleStep
                        key={step.index}
                        isOpen={expanded.has(`decode-${step.index}`)}
                        onToggle={() => toggle(`decode-${step.index}`)}
                        header={
                          <span className="font-mono text-sm">
                            {step.base64Char} → {step.decimal} → {step.bits}
                          </span>
                        }
                      >
                        <div className="space-y-1 text-sm">
                          <p>
                            {t("encoding.simulator.base64CharLabel")}:{" "}
                            <code className="font-mono">{step.base64Char}</code>
                          </p>
                          <p>
                            {t("encoding.simulator.decimalLabel")}:{" "}
                            <code className="font-mono">{step.decimal}</code>
                          </p>
                          <p>
                            {t("encoding.simulator.bitsLabel")}:{" "}
                            <code className="font-mono">{step.bits}</code>
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
                      {t("encoding.simulator.decodeStep2ConcatBits")}
                    </h4>
                    <div className="bg-muted/30 rounded-lg p-3 font-mono text-xs break-all">
                      {decodeSteps.map((s) => s.bits).join("")}
                    </div>
                  </div>
                )}

                <StepByStepToggle
                  open={expanded.has("2")}
                  onToggle={() => toggle("2")}
                />

                {expanded.has("2") && (
                  <div className="space-y-2">
                    <h4 className="text-foreground text-sm font-medium">
                      {t("encoding.simulator.decodeStep3ToChars")}
                    </h4>
                    {decodeByteSteps.map((step) => (
                      <CollapsibleStep
                        key={step.index}
                        isOpen={expanded.has(`byte-${step.index}`)}
                        onToggle={() => toggle(`byte-${step.index}`)}
                        header={
                          <span className="font-mono text-sm">
                            {step.bits} → '{step.char}'
                          </span>
                        }
                      >
                        <div className="space-y-1 text-sm">
                          <p>
                            {t("encoding.simulator.bitsLabel")}:{" "}
                            <code className="font-mono">{step.bits}</code>
                          </p>
                          <p>
                            {t("encoding.simulator.decimalLabel")}:{" "}
                            <code className="font-mono">{step.decimal}</code>
                          </p>
                          <p>
                            {t("encoding.simulator.charLabel")}:{" "}
                            <code className="font-mono">{step.char}</code>
                          </p>
                        </div>
                      </CollapsibleStep>
                    ))}
                  </div>
                )}

                {inputValue.trim().length > 0 && !result && (
                  <WarningBanner
                    variant="warning"
                    title={t(
                      "encoding.simulator.invalidBase64Title",
                      "Invalid Base64 Input",
                    )}
                  >
                    {t(
                      "encoding.simulator.invalidBase64Desc",
                      "The input contains invalid Base64 characters. Use only A-Z, a-z, 0-9, +, / and = for padding.",
                    )}
                  </WarningBanner>
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
            )}
          </div>
        )
      }
    />
  );
}
