import { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../services/api';

export interface WebSocketMessage {
  type: 'inference' | 'depth_data' | 'session_complete' | 'session_reset' | 'mode_change';
  // Inference message
  class_index?: number;
  class_label?: string;
  probs?: number[];
  // Depth data message
  session_id?: string;
  depth_cm?: number;
  buffer_len?: number;
  timestamp?: number;
  total_compressions?: number;
  // Session events
  message?: string;
  total_compressions_before_reset?: number;
  // Mode change events
  old_mode?: string;
  new_mode?: string;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

export const useWebSocket = (sessionId: string): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    // Prevent multiple connection attempts
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      console.log(`Attempting WebSocket connection for session: ${sessionId}`);
      const ws = apiService.createWebSocket(sessionId);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`WebSocket connected for session: ${sessionId}`);
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0; // Reset attempts on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected, code:', event.code, 'reason:', event.reason);
        setIsConnected(false);
        wsRef.current = null;
        
        // Auto-reconnect with exponential backoff if under attempt limit
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, delay);
        } else {
          setError('Max reconnection attempts reached');
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setIsConnected(false);
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to create WebSocket connection');
      setIsConnected(false);
    }
  }, [sessionId]);

  const disconnect = useCallback(() => {
    console.log('Manually disconnecting WebSocket');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setLastMessage(null);
    setError(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  // Auto-connect when component mounts or sessionId changes
  useEffect(() => {
    console.log(`useWebSocket effect triggered for session: ${sessionId}`);
    
    // Small delay to ensure component is fully mounted
    const connectTimer = setTimeout(() => {
      connect();
    }, 100);
    
    return () => {
      clearTimeout(connectTimer);
      disconnect();
    };
  }, [sessionId]); // Only depend on sessionId, not connect/disconnect to avoid loops

  return {
    isConnected,
    lastMessage,
    error,
    connect,
    disconnect,
  };
};
