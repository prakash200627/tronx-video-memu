"use client";

import { useCallback, useEffect, useRef, useState, memo } from "react";
import { AlertCircle, Loader2, Volume2, VolumeX, RotateCcw } from "lucide-react";
import type HlsType from "hls.js";

type VisiblePlayer = {
  ratio: number;
  priority: number;
  setActive: (active: boolean) => void;
};

const visiblePlayers = new Map<symbol, VisiblePlayer>();
let activePlayerId: symbol | null = null;

function updateActivePlayer() {
  const next = [...visiblePlayers.entries()].sort(
    ([, left], [, right]) =>
      right.priority - left.priority || right.ratio - left.ratio,
  ).find(([, player]) => player.ratio > 0)?.[0] ?? null;

  if (activePlayerId === next) return;
  activePlayerId = next;
  visiblePlayers.forEach((player, id) => player.setActive(id === next));
}

function updatePlayerVisibility(
  id: symbol,
  ratio: number,
  priority: number,
  setActive: (active: boolean) => void,
) {
  visiblePlayers.set(id, { ratio, priority, setActive });
  updateActivePlayer();
}

type VideoPlayerProps = {
  videoUrl: string;
  posterUrl?: string;
  title?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  playbackPriority?: boolean;
  className?: string;
};

function VideoPlayer({
  videoUrl,
  posterUrl,
  title,
  autoPlay = true,
  muted: initialMuted = true,
  controls = true,
  loop = true,
  playbackPriority = false,
  className = "",
}: VideoPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerIdRef = useRef(Symbol("video-player"));
  const isActiveRef = useRef(false);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const hlsRef = useRef<HlsType | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 2;

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const setPlayerActive = useCallback((active: boolean) => {
    if (!active) videoRef.current?.pause();
    isActiveRef.current = active;
    setIsActive((previous) => (previous === active ? previous : active));
  }, []);

  useEffect(() => {
    const element = playerRef.current;
    if (!element) return;

    const id = playerIdRef.current;
    const priority = playbackPriority ? 1 : 0;
    const reportVisibility = (ratio: number) =>
      updatePlayerVisibility(id, ratio, priority, setPlayerActive);

    if (typeof IntersectionObserver === "undefined") {
      reportVisibility(1);
      return () => reportVisibility(0);
    }

    const observer = new IntersectionObserver(
      ([entry]) => reportVisibility(entry.isIntersecting ? entry.intersectionRatio : 0),
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      reportVisibility(0);
    };
  }, [playbackPriority, setPlayerActive]);

  const playIfActive = useCallback(
    (video: HTMLVideoElement) => {
      if (!autoPlay || !isActiveRef.current) return;
      video.muted = true;
      video.play().catch(() => {
        // A rejected muted autoplay leaves the poster/image visible as fallback.
        video.muted = true;
        setIsMuted(true);
      });
    },
    [autoPlay],
  );

  const initVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !videoUrl || !isActiveRef.current) return;

    if (video.getAttribute("src") === videoUrl || hlsRef.current) {
      playIfActive(video);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    destroyHls();

    const isHlsUrl =
      videoUrl.includes(".m3u8") ||
      videoUrl.includes("/hls/") ||
      videoUrl.includes("format=m3u8");

    try {
      if (
        isHlsUrl &&
        Boolean(video.canPlayType("application/vnd.apple.mpegurl"))
      ) {
        video.src = videoUrl;
        playIfActive(video);
        return;
      }

      if (isHlsUrl) {
        const HlsModule = (await import("hls.js")).default;
        if (!isActiveRef.current) return;

        if (HlsModule.isSupported()) {
          const hls = new HlsModule({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
          });
          hlsRef.current = hls;
          hls.loadSource(videoUrl);
          hls.attachMedia(video);

          hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            playIfActive(video);
          });

          hls.on(HlsModule.Events.ERROR, (_event, data) => {
            if (!data.fatal) return;
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current += 1;
              switch (data.type) {
                case HlsModule.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case HlsModule.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  destroyHls();
                  setHasError(true);
                  setIsLoading(false);
              }
            } else {
              destroyHls();
              setHasError(true);
              setIsLoading(false);
            }
          });
          return;
        }
      }

      video.src = videoUrl;
      playIfActive(video);
    } catch {
      setHasError(true);
      setIsLoading(false);
    }
  }, [destroyHls, playIfActive, videoUrl]);

  useEffect(() => {
    isActiveRef.current = isActive;
    const video = videoRef.current;
    if (!video) return;

    let frameId: number | undefined;
    if (isActive) {
      retryCountRef.current = 0;
      hlsRef.current?.startLoad();
      frameId = window.requestAnimationFrame(() => void initVideo());
    } else {
      video.pause();
      hlsRef.current?.stopLoad();
    }

    return () => {
      if (frameId !== undefined) window.cancelAnimationFrame(frameId);
    };
  }, [initVideo, isActive]);

  useEffect(
    () => () => {
      visiblePlayers.delete(playerIdRef.current);
      updateActivePlayer();
      destroyHls();
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    },
    [destroyHls],
  );

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleRetry = () => {
    retryCountRef.current = 0;
    void initVideo();
  };

  return (
    <div
      ref={playerRef}
      className={`relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-950 ${className} ${hasError && !controls ? "invisible" : ""}`}
    >
      <video
        ref={videoRef}
        poster={isActive ? posterUrl : undefined}
        autoPlay={autoPlay && isActive}
        muted={initialMuted || (autoPlay && isActive)}
        playsInline
        loop={loop}
        controls={controls}
        preload="none"
        aria-label={title ? `${title} video preview` : "Dish video preview"}
        className="h-full w-full object-cover"
        onLoadedData={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />

      {controls && isLoading && !hasError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/60 px-4 py-3 text-white/90 backdrop-blur-md">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
            <span className="text-xs font-medium">Loading video...</span>
          </div>
        </div>
      )}

      {controls && hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900/95 p-4 text-center">
          <AlertCircle className="h-8 w-8 text-amber-400" />
          <p className="text-sm font-medium text-white/90">
            Video temporarily unavailable
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {controls && !hasError && !isLoading && (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute video" : "Mute video"}
          className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/75 text-white backdrop-blur-md transition hover:bg-black hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}

export default memo(VideoPlayer);
