import { useState, useEffect, useCallback } from 'react';
import { apiService, PredictionResult } from '../services/api';
import { useWebSocket } from './useWebSocket';

export interface DepthDataPoint {
  time: number;
  depth: number;
  timestamp: Date;
}

export interface CPRStatistics {
  totalCompressions: number;
  percentageDangkal: number;
  percentageDalam: number;
  averageDepth: number;
}

export interface CPRAlert {
  type: 'success' | 'warning' | 'danger';
  message: string;
  timestamp: Date;
}

export interface UseCPRMonitoringReturn {
  // Connection state
  isConnected: boolean;
  sessionId: string;
  isHealthy: boolean;
  
  // Real-time data
  currentPrediction: PredictionResult | null;
  depthData: DepthDataPoint[];
  statistics: CPRStatistics;
  currentAlert: CPRAlert | null;
  bufferLength: number;
  
  // Actions
  loadDepthData: () => Promise<void>;
  clearData: () => void;
  setSessionId: (id: string) => void;
  
  // Errors
  error: string | null;
}

const initialStatistics: CPRStatistics = {
  totalCompressions: 0,
  percentageDangkal: 0,
  percentageDalam: 0,
  averageDepth: 0,
};

export const useCPRMonitoring = (initialSessionId: string = 'default'): UseCPRMonitoringReturn => {
  const [sessionId, setSessionIdState] = useState(initialSessionId);
  const [isHealthy, setIsHealthy] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [depthData, setDepthData] = useState<DepthDataPoint[]>([]);
  const [statistics, setStatistics] = useState<CPRStatistics>(initialStatistics);
  const [currentAlert, setCurrentAlert] = useState<CPRAlert | null>(null);
  const [bufferLength, setBufferLength] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Separate state for total compressions count (persistent across session)
  // Removed unused session-wide arrays (statistics derived directly when needed)
  
  // Calculate statistics from all session depths
  const calculateSessionStatistics = useCallback((allDepths: number[]) => {
    if (allDepths.length === 0) {
      return initialStatistics;
    }

    const totalCompressions = allDepths.length;
    const averageDepth = allDepths.reduce((sum, depth) => sum + depth, 0) / totalCompressions;
    const shallowCount = allDepths.filter(depth => depth < 5).length;
    const deepCount = allDepths.filter(depth => depth > 6).length;
    const percentageDangkal = (shallowCount / totalCompressions) * 100;
    const percentageDalam = (deepCount / totalCompressions) * 100;

    return {
      totalCompressions,
      percentageDangkal,
      percentageDalam,
      averageDepth,
    };
  }, []);

  const { isConnected, lastMessage, disconnect } = useWebSocket(sessionId);

  // Legacy depth-based alert (kept for potential fallback)
  // const generateAlert = useCallback((depth: number) => {
  //   if (depth < 4) {
  //     setCurrentAlert({
  //       type: 'danger',
  //       message: 'Kompresi terlalu dangkal! Tekan lebih dalam.',
  //       timestamp: new Date(),
  //     });
  //   } else if (depth < 5) {
  //     setCurrentAlert({
  //       type: 'warning',
  //       message: 'Kompresi agak dangkal. Perbaiki tekanan.',
  //       timestamp: new Date(),
  //     });
  //   } else if (depth > 7) {
  //     setCurrentAlert({
  //       type: 'warning',
  //       message: 'Kompresi terlalu dalam. Kurangi tekanan.',
  //       timestamp: new Date(),
  //     });
  //   } else if (depth >= 5 && depth <= 6) {
  //     setCurrentAlert({
  //       type: 'success',
  //       message: 'Kompresi sangat baik! Pertahankan.',
  //       timestamp: new Date(),
  //     });
  //   }
  // }, []);

  // Generate alert based on model prediction results
  const generateModelAlert = useCallback((classIndex: number) => {
    switch (classIndex) {
      case 0: // "stabil"
        setCurrentAlert({
          type: 'success',
          message: 'Teknik CPR stabil! Pertahankan ritme ini.',
          timestamp: new Date(),
        });
        break;
      case 1: // "ga stabil"
        setCurrentAlert({
          type: 'danger',
          message: 'Teknik CPR tidak stabil! Perbaiki konsistensi.',
          timestamp: new Date(),
        });
        break;
      case 2: // "cenderung atas"
        setCurrentAlert({
          type: 'warning',
          message: 'Kompresi cenderung dangkal. Tekan lebih dalam.',
          timestamp: new Date(),
        });
        break;
      case 3: // "cenderung bawah"
        setCurrentAlert({
          type: 'warning',
          message: 'Kompresi cenderung terlalu dalam. Kurangi tekanan.',
          timestamp: new Date(),
        });
        break;
      default:
        setCurrentAlert({
          type: 'warning',
          message: 'Menunggu analisis teknik CPR...',
          timestamp: new Date(),
        });
    }
  }, []);

  // Health check
  const checkHealth = useCallback(async () => {
    try {
      const health = await apiService.checkHealth();
      setIsHealthy(health.status === 'ok');
      setError(null);
    } catch (err) {
      setIsHealthy(false);
      setError(err instanceof Error ? err.message : 'Health check failed');
    }
  }, []);

  // Load depth data from backend
  const loadDepthData = useCallback(async () => {
    try {
      const response = await apiService.getDepthData(sessionId, 120); // Get up to 120 points
      const depthPoints = response.depth_data.map((point, index) => ({
        time: index,
        depth: point.depth,
        timestamp: new Date(point.timestamp * 1000),
      }));
      setDepthData(depthPoints);
      setBufferLength(response.buffer_len);
      
      // Extract depths for session statistics
      const depths = depthPoints.map(point => point.depth);
  // session arrays removed; statistics already computed
      
      // Calculate statistics from all loaded data
      if (depths.length > 0) {
        const newStats = calculateSessionStatistics(depths);
        setStatistics(newStats);

        // Note: Alert generation now handled by model predictions, not individual depth values
      }

      setError(null);
    } catch (err) {
      console.error('Failed to load depth data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load depth data');
    }
  }, [sessionId, calculateSessionStatistics]);

  // Get last result
  const getLastResult = useCallback(async () => {
    try {
      const response = await apiService.getLastResult(sessionId);
      setBufferLength(response.buffer_len);
      if (response.result) {
        setCurrentPrediction(response.result);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get last result');
    }
  }, [sessionId]);

  // Clear all data
  const clearData = useCallback(async () => {
    try {
      // Call backend reset API
      await apiService.resetSession(sessionId);
      
      // Clear frontend state
  setDepthData([]);
  setStatistics(initialStatistics);
  setCurrentPrediction(null);
  setCurrentAlert(null);
  setBufferLength(0);
      setError(null);
    } catch (err) {
      console.error('Failed to reset session:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset session');
    }
  }, [sessionId]);

  // Set session ID
  const setSessionId = useCallback((id: string) => {
    disconnect();
    setSessionIdState(id);
    clearData();
  }, [disconnect, clearData]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'inference') {
      if (lastMessage.class_index !== undefined && 
          lastMessage.class_label !== undefined && 
          lastMessage.probs !== undefined) {
        setCurrentPrediction({
          class_index: lastMessage.class_index,
          class_label: lastMessage.class_label,
          probs: lastMessage.probs,
        });
        
        // Generate alert based on model prediction
        generateModelAlert(lastMessage.class_index);
        
        // Reload depth data when new prediction comes
        loadDepthData();
      }
    }
    
    // Handle depth_data messages untuk real-time statistics update
    if (lastMessage && lastMessage.type === 'depth_data') {
      const newDepthPoint: DepthDataPoint = {
        time: Date.now(),
        depth: lastMessage.depth_cm!,
        timestamp: new Date(lastMessage.timestamp! * 1000),
      };
      
      // Update visual depth data for chart (keep all data up to 120 points)
      setDepthData(prev => {
        const newData = [...prev, newDepthPoint].slice(-120); // Keep last 120 points for chart
        return newData;
      });
      
      // Update total session compressions and depths
      // Incremental statistics update
      setStatistics(prev => {
        const totalCompressions = prev.totalCompressions + 1;
        const averageDepth = (prev.averageDepth * prev.totalCompressions + lastMessage.depth_cm!) / totalCompressions;
        const shallowPrev = prev.percentageDangkal / 100 * prev.totalCompressions;
        const deepPrev = prev.percentageDalam / 100 * prev.totalCompressions;
        const shallowNow = shallowPrev + (lastMessage.depth_cm! < 5 ? 1 : 0);
        const deepNow = deepPrev + (lastMessage.depth_cm! > 6 ? 1 : 0);
        return {
          totalCompressions,
          averageDepth,
          percentageDangkal: shallowNow / totalCompressions * 100,
          percentageDalam: deepNow / totalCompressions * 100,
        };
      });
      
      setBufferLength(lastMessage.buffer_len!);
      // Note: Alert is now generated based on model prediction, not individual depth
    }
    
    // Handle session completion (120 compressions reached)
    if (lastMessage && lastMessage.type === 'session_complete') {
      setCurrentAlert({
        type: 'success',
        message: lastMessage.message || '120 kompresi tercapai! Sesi direset otomatis.',
        timestamp: new Date(),
      });
      
      // Clear frontend state after auto-reset
  setDepthData([]);
  setStatistics(initialStatistics);
  setBufferLength(0);
    }
    
    // Handle manual session reset
    if (lastMessage && lastMessage.type === 'session_reset') {
      setCurrentAlert({
        type: 'success',
        message: lastMessage.message || 'Sesi direset manual.',
        timestamp: new Date(),
      });
      
      // Clear frontend state after manual reset
  setDepthData([]);
  setStatistics(initialStatistics);
  setBufferLength(0);
    }
  }, [lastMessage, loadDepthData, generateModelAlert, calculateSessionStatistics]);

  // Initial setup
  useEffect(() => {
    checkHealth();
    getLastResult();
    loadDepthData();
  }, [checkHealth, getLastResult, loadDepthData]);

  // Periodic health check
  useEffect(() => {
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    isConnected,
    sessionId,
    isHealthy,
    currentPrediction,
    depthData,
    statistics,
    currentAlert,
    bufferLength,
    loadDepthData,
    clearData,
    setSessionId,
    error,
  };
};
