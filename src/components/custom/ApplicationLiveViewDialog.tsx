import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchApplicationLiveView } from "@/services/job";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ApplicationLiveViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobApplicationId: string | null;
}

type LiveViewState =
  | "connecting"
  | "playing"
  | "paused"
  | "connected"
  | "diagnostic";

function messageType(data: unknown): string | undefined {
  if (typeof data === "string") return data;
  if (data && typeof data === "object" && "type" in data) {
    const type = (data as { type?: unknown }).type;
    return typeof type === "string" ? type : undefined;
  }
  return undefined;
}

export default function ApplicationLiveViewDialog({
  open,
  onOpenChange,
  jobApplicationId,
}: ApplicationLiveViewDialogProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [viewerStatus, setViewerStatus] = useState<{
    url?: string;
    state: LiveViewState;
    diagnostic: string;
  }>({ state: "connecting", diagnostic: "" });
  const query = useQuery({
    queryKey: ["application-live-view", jobApplicationId],
    queryFn: () => fetchApplicationLiveView(jobApplicationId!),
    enabled: open && !!jobApplicationId,
    retry: false,
    refetchInterval: open ? 5000 : false,
  });
  const url = query.isSuccess ? query.data.url : undefined;
  const readOnlyURL = url
    ? (() => {
        const liveViewURL = new URL(url);
        liveViewURL.searchParams.set("readOnly", "true");
        return liveViewURL.toString();
      })()
    : undefined;
  const viewState =
    viewerStatus.url === readOnlyURL ? viewerStatus.state : "connecting";
  const connectionDiagnostic =
    viewerStatus.url === readOnlyURL ? viewerStatus.diagnostic : "";

  useEffect(() => {
    if (!readOnlyURL) return;
    const expectedOrigin = new URL(readOnlyURL).origin;
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== expectedOrigin ||
        event.source !== frameRef.current?.contentWindow
      ) {
        return;
      }
      switch (messageType(event.data)) {
        case "KERNEL_PLAYING":
          setViewerStatus({
            url: readOnlyURL,
            state: "playing",
            diagnostic: "",
          });
          break;
        case "KERNEL_PAUSED":
          setViewerStatus({
            url: readOnlyURL,
            state: "paused",
            diagnostic: "",
          });
          break;
        case "KERNEL_CONNECTED":
          setViewerStatus((current) => ({
            url: readOnlyURL,
            state:
              current.url === readOnlyURL && current.state === "playing"
                ? "playing"
                : "connected",
            diagnostic: "",
          }));
          break;
        case "KERNEL_CONNECTION_TIMEOUT": {
          const payload = event.data as {
            reason?: unknown;
            iceConnectionState?: unknown;
            connectionState?: unknown;
          };
          const diagnostic = [
            payload.reason,
            payload.iceConnectionState,
            payload.connectionState,
          ]
            .filter((value): value is string => typeof value === "string")
            .join(" · ");
          setViewerStatus({
            url: readOnlyURL,
            state: "diagnostic",
            diagnostic,
          });
          break;
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [readOnlyURL]);

  const statusText: Record<LiveViewState, string> = {
    connecting: "Connecting to the browser…",
    playing: "Browser frames are rendering. View-only during automation.",
    paused: "The browser is paused. Use the structured action form when prompted.",
    connected: "Connected; waiting for browser frames.",
    diagnostic: "The browser connection did not start rendering.",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,1100px)] max-w-none">
        <DialogHeader>
          <DialogTitle>Application browser</DialogTitle>
          <DialogDescription>
            Read-only view. Interactions are disabled while automation is running.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground" role="status">
          {readOnlyURL
            ? `${statusText[viewState]}${connectionDiagnostic ? ` ${connectionDiagnostic}` : ""}`
            : query.isFetching
              ? "Loading browser view…"
              : "No active browser view. The browser may have closed or this application may not use Kernel."}
        </p>
        {readOnlyURL && (
          <iframe
            ref={frameRef}
            title="Read-only application browser"
            src={readOnlyURL}
            allow="autoplay; clipboard-read; clipboard-write"
            allowFullScreen
            className="h-[70vh] w-full rounded-md border bg-black pointer-events-none"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
