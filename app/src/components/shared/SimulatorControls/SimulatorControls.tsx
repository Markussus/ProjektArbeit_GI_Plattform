import { Play, Pause, StepForward, StepBack, SkipBack } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { SimulationStatus } from '@/hooks/useSimulationEngine';

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
}: SimulatorControlsProps) {
  const { t } = useTranslation();

  const isPlaying = status === 'RUNNING';
  const isError = status === 'ERROR';

  const rangeMin = 0;
  const rangeMax = 100;

  const speedPercent = ((maxSpeed - speed) / (maxSpeed - minSpeed)) * 100;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number(e.target.value);
    const newSpeed = maxSpeed - (percent / 100) * (maxSpeed - minSpeed);
    onSpeedChange(newSpeed);
  };

  const buttonClasses = cn(
    "flex items-center justify-center p-2 rounded-md transition-colors",
    "bg-background border border-input hover:bg-accent hover:text-accent-foreground",
    "disabled:opacity-50 disabled:cursor-not-allowed"
  );

  return (
    <div className={cn("flex flex-col gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm w-full max-w-md", className)}>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onReset}
          className={buttonClasses}
          title={t('simulation.controls.reset', 'Reset')}
          aria-label={t('simulation.controls.reset', 'Reset')}
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={onStepBack}
          disabled={isPlaying}
          className={buttonClasses}
          title={t('simulation.controls.stepBack', 'Step backward')}
          aria-label={t('simulation.controls.stepBack', 'Step backward')}
        >
          <StepBack className="w-5 h-5" />
        </button>

        {isPlaying ? (
          <button
            onClick={onPause}
            className={cn(buttonClasses, "bg-primary text-primary-foreground hover:bg-primary/90")}
            title={t('simulation.controls.pause', 'Pause')}
            aria-label={t('simulation.controls.pause', 'Pause')}
          >
            <Pause className="w-5 h-5 fill-current" />
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={isError}
            className={cn(buttonClasses, "bg-primary text-primary-foreground hover:bg-primary/90")}
            title={t('simulation.controls.play', 'Play')}
            aria-label={t('simulation.controls.play', 'Play')}
          >
            <Play className="w-5 h-5 fill-current" />
          </button>
        )}

        <button
          onClick={onStep}
          disabled={isPlaying || isError}
          className={buttonClasses}
          title={t('simulation.controls.step', 'Step forward')}
          aria-label={t('simulation.controls.step', 'Step forward')}
        >
          <StepForward className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium whitespace-nowrap opacity-75">
          {t('simulation.controls.speed', 'Speed')}:
        </span>
        <input
          type="range"
          min={rangeMin}
          max={rangeMax}
          value={speedPercent}
          onChange={handleSliderChange}
          className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
          aria-label={t('simulation.controls.speed', 'Speed')}
        />
      </div>
    </div>
  );
}


