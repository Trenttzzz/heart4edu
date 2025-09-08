import React, { useState, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';

interface WebSocketMessage {
  type: string;
  timestamp: Date;
  data: any;
}

interface WebSocketLogProps {
  lastMessage: any;
  isConnected: boolean;
}

export const WebSocketLog: React.FC<WebSocketLogProps> = ({
  lastMessage,
  isConnected,
}) => {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [maxMessages] = useState(50);

  useEffect(() => {
    if (lastMessage) {
      const newMessage: WebSocketMessage = {
        type: lastMessage.type || 'unknown',
        timestamp: new Date(),
        data: lastMessage,
      };

      setMessages(prev => {
        const updated = [newMessage, ...prev];
        return updated.slice(0, maxMessages); // Keep only last N messages
      });
    }
  }, [lastMessage, maxMessages]);

  const clearMessages = () => {
    setMessages([]);
  };

  const formatMessage = (message: WebSocketMessage) => {
    if (message.type === 'inference') {
      return {
        title: 'Model Prediction',
        content: `${message.data.class_label} (${message.data.class_index}) - ${(message.data.probs?.[message.data.class_index] * 100)?.toFixed(1)}%`,
        color: 'text-blue-600',
      };
    }

    return {
      title: message.type.charAt(0).toUpperCase() + message.type.slice(1),
      content: JSON.stringify(message.data, null, 2),
      color: 'text-gray-600',
    };
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <MessageSquare className="w-6 h-6" />
        {messages.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {messages.length > 9 ? '9+' : messages.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-w-[90vw] bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">WebSocket Log</h3>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={clearMessages}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            Clear
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            No messages yet...
          </div>
        ) : (
          messages.map((message, index) => {
            const formatted = formatMessage(message);
            return (
              <div
                key={index}
                className="bg-gray-50 rounded-md p-2 text-sm border-l-2 border-blue-200"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium ${formatted.color}`}>
                    {formatted.title}
                  </span>
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-gray-700 text-xs">
                  {formatted.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 text-xs text-gray-500 text-center">
        {messages.length} messages • {isConnected ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
};
