// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VideoPlayer } from "@/components/shared/VideoPlayer/VideoPlayer";

describe("VideoPlayer", () => {
  it("renders with native controls by default and correctly passes tracks and sources", () => {
    render(
      <VideoPlayer
        url="/test-video.mp4"
        title="Sample Video"
        testId="test-video-player"
        tracks={[
          {
            src: "/captions.vtt",
            label: "German",
            srcLang: "de",
            kind: "subtitles",
            default: true,
          },
        ]}
      />,
    );

    const video = screen.getByTestId("test-video-player") as HTMLVideoElement;
    expect(video).toBeInTheDocument();
    expect(video.controls).toBe(true);
    expect(video.getAttribute("aria-label")).toBe("Sample Video");

    const source = video.querySelector("source");
    expect(source).not.toBeNull();
    expect(source?.getAttribute("src")).toBe("/test-video.mp4");
    expect(source?.getAttribute("type")).toBe("video/mp4");

    const track = video.querySelector("track");
    expect(track).not.toBeNull();
    expect(track?.getAttribute("src")).toBe("/captions.vtt");
    expect(track?.getAttribute("label")).toBe("German");
    expect(track?.getAttribute("srclang")).toBe("de");
  });

  it("allows setting controls to false if explicitly specified", () => {
    render(
      <VideoPlayer
        url="/test-video.mp4"
        testId="no-controls-player"
        controls={false}
      />,
    );

    const video = screen.getByTestId("no-controls-player") as HTMLVideoElement;
    expect(video.controls).toBe(false);
  });
});
