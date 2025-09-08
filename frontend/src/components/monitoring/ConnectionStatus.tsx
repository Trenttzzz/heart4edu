import React from 'react';
import { Wifi, WifiOff, Activity, AlertTriangle } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isHealthy: boolean;
  sessionId: string;
  bufferLength: number;
  error?: string | null;
  onReconnect?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isHealthy,
  sessionId,
  bufferLength,
  error,
  onReconnect,
}) => {
  const getStatusInfo = () => {
    if (error) {
      return {
        icon: <AlertTriangle className="w-4 h-4" />,
        status: 'Error',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
      };
    }

    if (isConnected && isHealthy) {
      return {
        icon: <Wifi className="w-4 h-4" />,
        status: 'Connected',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      };
    }

    return {
      icon: <WifiOff className="w-4 h-4" />,
      status: 'Disconnected',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`p-3 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={statusInfo.color}>
            {statusInfo.icon}
          </div>
          <span className={`font-medium ${statusInfo.color}`}>
            {statusInfo.status}
          </span>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-zinc-600">
          <div className="flex items-center space-x-1">
            <Activity className="w-3 h-3" />
            <span>Session: {sessionId}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <span>Buffer: {bufferLength}/10</span>
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${(bufferLength / 10) * 100}%` }}
              />
            </div>
          </div>
          
          {!isConnected && onReconnect && (
            <button
              onClick={onReconnect}
              className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};
