import { Play, Pause, StepForward, StepBack, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SimulationStatus } from "@/hooks/useSimulationEngine";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SimulatorControlsProps {
  status: SimulationStatus;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  minSpeed?: number;
  maxSpeed?: number;
  className?: string;
  testIdPrefix?: string;
}

export function SimulatorControls({
  status,
  speed,
  onPlay,
  onPause,
  onStep,
  onStepBack,
  onReset,
  onSpeedChange,
  minSpeed = 100,
  maxSpeed = 2000,
  className,
  testIdPrefix,
}: SimulatorControlsProps) {
  const { t } = useTranslation();

  const isPlaying = status === "RUNNING";
  const isError = status === "ERROR";

  const rangeMin = 0;
  const rangeMax = 100;

  const speedPercent = ((maxSpeed - speed) / (maxSpeed - minSpeed)) * 100;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number(e.target.value);
    const newSpeed = maxSpeed - (percent / 100) * (maxSpeed - minSpeed);
    onSpeedChange(newSpeed);
  };

  const buttonClasses = cn(
    "flex size-9 shrink-0 items-center justify-center rounded-md transition-colors",
    "bg-background border border-input hover:bg-accent hover:text-accent-foreground",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  );

  return (
    <div
      data-testid={testIdPrefix}
      className={cn(
        "bg-card text-card-foreground @container flex w-full max-w-md flex-col gap-4 rounded-lg border p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onReset}
          data-testid={testIdPrefix ? `${testIdPrefix}-reset` : undefined}
          className={buttonClasses}
          title={t("common.simulation.controls.reset", "Reset")}
          aria-label={t("common.simulation.controls.reset", "Reset")}
        >
          <RotateCcw className="size-4" />
        </button>

        <button
          type="button"
          onClick={onStepBack}
          disabled={isPlaying}
          data-testid={testIdPrefix ? `${testIdPrefix}-step-back` : undefined}
          className={buttonClasses}
          title={t("common.simulation.controls.stepBack", "Step backward")}
          aria-label={t("common.simulation.controls.stepBack", "Step backward")}
        >
          <StepBack className="size-4" />
        </button>

        {isPlaying ? (
          <button
            type="button"
            onClick={onPause}
            data-testid={testIdPrefix ? `${testIdPrefix}-pause` : undefined}
            className={cn(
              buttonClasses,
              "bg-brand text-brand-foreground hover:opacity-90",
            )}
            title={t("common.simulation.controls.pause", "Pause")}
            aria-label={t("common.simulation.controls.pause", "Pause")}
          >
            <Pause className="size-4 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onPlay}
            disabled={isError}
            data-testid={testIdPrefix ? `${testIdPrefix}-play` : undefined}
            className={cn(
              buttonClasses,
              "bg-brand text-brand-foreground hover:opacity-90",
            )}
            title={t("common.simulation.controls.play", "Play")}
            aria-label={t("common.simulation.controls.play", "Play")}
          >
            <Play className="size-4 fill-current" />
          </button>
        )}

        <button
          type="button"
          onClick={onStep}
          disabled={isPlaying || isError}
          data-testid={testIdPrefix ? `${testIdPrefix}-step` : undefined}
          className={buttonClasses}
          title={t("common.simulation.controls.step", "Step forward")}
          aria-label={t("common.simulation.controls.step", "Step forward")}
        >
          <StepForward className="size-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-sm font-medium whitespace-nowrap opacity-75">
          {t("common.simulation.controls.speed", "Speed")}:
        </span>
        <input
          type="range"
          min={rangeMin}
          max={rangeMax}
          value={speedPercent}
          onChange={handleSliderChange}
          className={cn(
            "h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-lg bg-transparent @xs:h-2",
            "max-w-44 basis-28 @xs:max-w-none @xs:basis-auto",
            "[&::-webkit-slider-runnable-track]:bg-secondary [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-lg @xs:[&::-webkit-slider-runnable-track]:h-2",
            "[&::-moz-range-track]:bg-secondary [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-lg [&::-moz-range-track]:border-0 @xs:[&::-moz-range-track]:h-2",
            "[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:mt-[-3.5px] [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 @xs:[&::-webkit-slider-thumb]:mt-[-4px] @xs:[&::-webkit-slider-thumb]:size-4",
            "[&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 @xs:[&::-moz-range-thumb]:size-4",
          )}
          aria-label={t("common.simulation.controls.speed", "Speed")}
          data-testid={testIdPrefix ? `${testIdPrefix}-speed` : undefined}
        />
      </div>
    </div>
  );
}
