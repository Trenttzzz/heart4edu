import React, { useState, useEffect } from 'react';
import { DepthChart } from '../components/monitoring/DepthChart';
import { ModelPrediction } from '../components/monitoring/ModelPrediction';
import { Statistics } from '../components/monitoring/Statistics';
import { AlertCard } from '../components/monitoring/AlertCard';
import { ConnectionStatus } from '../components/monitoring/ConnectionStatus';
import { WebSocketLog } from '../components/monitoring/WebSocketLog';
import { useCPRMonitoring } from '../hooks/useCPRMonitoring';
import { useWebSocket } from '../hooks/useWebSocket';
import { apiService } from '../services/api';
import { MetronomeControl } from '../components/monitoring/MetronomeControl';

export const MonitoringPage: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [windowMode, setWindowMode] = useState<'sliding' | 'nonoverlap'>('nonoverlap');

  // Handle mode change
  const handleModeChange = async () => {
    const newMode = windowMode === 'sliding' ? 'nonoverlap' : 'sliding';
    try {
      await apiService.updateMode(sessionId, newMode);
      setWindowMode(newMode);
    } catch (err) {
      console.error('Failed to update mode:', err);
    }
  };
  
  // Initialize CPR monitoring hook
  const {
    isConnected,
    sessionId,
    isHealthy,
    currentPrediction,
    depthData,
    statistics,
    currentAlert,
    bufferLength,
    clearData,
    error,
  } = useCPRMonitoring('esp32-sesi-01');

  // Initialize WebSocket hook for logging and manual control
  const { lastMessage, connect: reconnectWebSocket } = useWebSocket(sessionId);

  // Convert our depth data to the format expected by DepthChart
  const chartData = depthData.map(point => ({
    time: point.time,
    depth: point.depth,
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load current mode on mount
  useEffect(() => {
    const loadMode = async () => {
      try {
        const modeResponse = await apiService.getMode(sessionId);
        setWindowMode(modeResponse.mode as 'sliding' | 'nonoverlap');
      } catch (err) {
        console.error('Failed to load mode:', err);
      }
    };
    loadMode();
  }, [sessionId]);

  // Handle WebSocket mode change messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'mode_change') {
      setWindowMode(lastMessage.new_mode as 'sliding' | 'nonoverlap');
    }
  }, [lastMessage]);

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Connection Status + Metronome */}
        <div className="mb-6 flex flex-col gap-4">
          <ConnectionStatus
            isConnected={isConnected}
            isHealthy={isHealthy}
            sessionId={sessionId}
            bufferLength={bufferLength}
            error={error}
            onReconnect={reconnectWebSocket}
          />
          <MetronomeControl bpm={100} />
        </div>

        {/* Action Controls */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
            <button
              onClick={clearData}
              className="px-3 py-1 text-sm bg-zinc-200 hover:bg-zinc-300 rounded-md transition-colors"
            >
              Reset Data
            </button>

            <button
              onClick={reconnectWebSocket}
              className="px-3 py-1 text-sm bg-blue-200 hover:bg-blue-300 text-blue-800 rounded-md transition-colors"
            >
              Force Reconnect
            </button>

            {/* Window Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-600">Mode:</span>
              <button
                onClick={handleModeChange}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  windowMode === 'nonoverlap' 
                    ? 'bg-green-200 hover:bg-green-300 text-green-800' 
                    : 'bg-orange-200 hover:bg-orange-300 text-orange-800'
                }`}
              >
                {windowMode === 'nonoverlap' ? 'Non-overlap' : 'Sliding'}
              </button>
              <span className="text-xs text-zinc-500">
                {windowMode === 'nonoverlap' ? '(Reset buffer setiap prediksi)' : '(Buffer overlap)'}
              </span>
            </div>
        </div>

        {/* Main Grid - New Horizontal Layout */}
        <div className="space-y-6">
          {/* Top Row - Alert, Model Prediction, Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Alert */}
            {currentAlert && (
              <AlertCard
                type={currentAlert.type}
                message={currentAlert.message}
              />
            )}
            
            {/* Model Prediction */}
            <ModelPrediction
              classIndex={currentPrediction?.class_index ?? -1}
              label={currentPrediction?.class_label || 'Menunggu prediksi...'}
              lastUpdated={currentTime}
              probs={currentPrediction?.probs}
            />
            
            {/* Statistics */}
            <Statistics
              totalCompressions={statistics.totalCompressions}
              percentageDangkal={statistics.percentageDangkal}
              percentageDalam={statistics.percentageDalam}
              averageDepth={statistics.averageDepth}
            />
          </div>
          
          {/* Bottom Row - Depth Chart Full Width */}
          <div className="w-full">
            <DepthChart data={chartData} />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 py-6 text-center text-sm text-zinc-500 border-t border-zinc-200">
          <p>Copyright © Heart4Edu 2025</p>
        </footer>

        {/* WebSocket Log (Floating) */}
        <WebSocketLog
          lastMessage={lastMessage}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
};
