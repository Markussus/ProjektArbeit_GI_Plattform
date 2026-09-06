import { cn } from "@/lib/utils";

type VideoTrackKind =
  "subtitles" | "captions" | "descriptions" | "chapters" | "metadata";

interface VideoPlayerTrack {
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
  controls?: boolean;
  preload?: "none" | "metadata" | "auto";
}

export function VideoPlayer({
  url,
  title,
  className,
  tracks = [],
  testId,
  controls = true,
  preload = "none",
}: VideoPlayerProps) {
  return (
    <video
      aria-label={title}
      className={cn(
        "bg-muted aspect-video w-full max-w-[10cm] rounded-lg object-contain",
        className,
      )}
      controls={controls}
      preload={preload}
      playsInline
      data-testid={testId}
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
