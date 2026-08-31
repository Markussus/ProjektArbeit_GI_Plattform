import { useState } from "react";
import { cn } from "@/lib/utils";

type VideoTrackKind =
  "subtitles" | "captions" | "descriptions" | "chapters" | "metadata";

export interface VideoPlayerTrack {
  src: string;
  label: string;
  srcLang: string;
  kind?: VideoTrackKind;
  default?: boolean;
}

interface VideoPlayerProps {
  url: string;
  title?: string;
  className?: string;
  tracks?: VideoPlayerTrack[];
  testId?: string;
}

export function VideoPlayer({
  url,
  title,
  className,
  tracks = [],
  testId,
}: VideoPlayerProps) {
  const [showControls, setShowControls] = useState(false);

  return (
    <video
      aria-label={title}
      className={cn(
        "bg-muted aspect-video w-full max-w-[10cm] rounded-lg object-contain",
        className,
      )}
      controls={showControls}
      preload="auto"
      playsInline
      data-testid={testId}
      onBlur={() => setShowControls(false)}
      onFocus={() => setShowControls(true)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      tabIndex={0}
    >
      <source src={url} type="video/mp4" />
      {tracks.map((track) => (
        <track
          key={`${track.srcLang}-${track.label}-${track.src}`}
          src={track.src}
          kind={track.kind ?? "subtitles"}
          srcLang={track.srcLang}
          label={track.label}
          default={track.default}
        />
      ))}
    </video>
  );
}
