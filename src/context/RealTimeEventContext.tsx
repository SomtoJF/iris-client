"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { BaseRoute } from "../services/routes";

type RealtimeEventHandler = (data: any) => void;
type RealtimeEventAction = string | string[];

interface RealtimeEventContextType {
  isConnected: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  addEventListener: (
    actionType: RealtimeEventAction,
    handler: RealtimeEventHandler,
  ) => () => void;
  removeEventListener: (
    actionType: string,
    handler: RealtimeEventHandler,
  ) => void;
}

const RealtimeEventContext = createContext<
  RealtimeEventContextType | undefined
>(undefined);

export function useRealtimeEvents() {
  const context = useContext(RealtimeEventContext);
  if (!context) {
    throw new Error(
      "useRealtimeEvents must be used within a RealtimeEventProvider",
    );
  }
  return context;
}

export function useOptionalRealtimeEvents() {
  return useContext(RealtimeEventContext);
}

interface RealtimeEvent {
  action: string;
  data: any;
}

export function RealtimeEventProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");

  const eventSourceRef = useRef<EventSource | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<(data: any) => void>>>(
    new Map(),
  );
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus("connecting");

    try {
      const eventSource = new EventSource(`${BaseRoute}/realtime/events`, {
        withCredentials: true,
      });

      eventSource.onopen = () => {
        setIsConnected(true);
        setConnectionStatus("connected");
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const eventData: RealtimeEvent = JSON.parse(event.data);
          // Call all registered handlers for this action type
          const handlers = eventHandlersRef.current.get(eventData.action);
          if (handlers) {
            handlers.forEach((handler) => {
              try {
                handler(eventData.data);
              } catch (error) {
                console.error(
                  "❌ [RealtimeEvents] Error in event handler:",
                  error,
                );
              }
            });
          }

          const allHandlers = eventHandlersRef.current.get("ALL");
          if (allHandlers) {
            allHandlers.forEach((handler) => {
              try {
                handler(eventData);
              } catch (error) {
                console.error(
                  "❌ [RealtimeEvents] Error in ALL event handler:",
                  error,
                );
              }
            });
          }
        } catch (error) {
          console.error(
            "❌ [RealtimeEvents] Failed to parse event data:",
            error,
          );
        }
      };

      eventSource.onerror = (error) => {
        console.warn("❌ [RealtimeEvents] SSE connection error:", error);
        setIsConnected(false);
        setConnectionStatus("error");

        eventSource.close();
        eventSourceRef.current = null;

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const backoffTime = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000,
          );
          console.log(
            `🔄 [RealtimeEvents] Reconnecting in ${backoffTime}ms (attempt ${
              reconnectAttemptsRef.current + 1
            }/${maxReconnectAttempts})`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, backoffTime);
        } else {
          console.error(
            "❌ [RealtimeEvents] Max reconnection attempts reached",
          );
          setConnectionStatus("disconnected");
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error("❌ [RealtimeEvents] Failed to create EventSource:", error);
      setConnectionStatus("error");
    }
  }, []);

  const disconnect = () => {
    console.log("🔌 [RealtimeEvents] Disconnecting from SSE endpoint...");

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus("disconnected");
    reconnectAttemptsRef.current = 0;
  };

  const addEventListener = (
    actionType: RealtimeEventAction,
    handler: RealtimeEventHandler,
  ): (() => void) => {
    const actions = Array.isArray(actionType) ? actionType : [actionType];

    actions.forEach((action) => {
      if (!eventHandlersRef.current.has(action)) {
        eventHandlersRef.current.set(action, new Set());
      }

      eventHandlersRef.current.get(action)!.add(handler);
    });

    // Return cleanup function
    return () => {
      actions.forEach((action) => removeEventListener(action, handler));
    };
  };

  const removeEventListener = (
    actionType: string,
    handler: RealtimeEventHandler,
  ) => {
    const handlers = eventHandlersRef.current.get(actionType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        eventHandlersRef.current.delete(actionType);
      }
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !isConnected) {
        console.log(
          "👁️ [RealtimeEvents] Tab became visible, attempting to reconnect...",
        );
        connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isConnected, connect]);

  const contextValue: RealtimeEventContextType = {
    isConnected,
    connectionStatus,
    addEventListener,
    removeEventListener,
  };

  return (
    <RealtimeEventContext.Provider value={contextValue}>
      {children}
    </RealtimeEventContext.Provider>
  );
}
