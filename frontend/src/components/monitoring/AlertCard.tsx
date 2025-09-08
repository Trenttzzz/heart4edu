import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface AlertCardProps {
  type: 'success' | 'warning' | 'danger';
  message: string;
}

export const AlertCard: React.FC<AlertCardProps> = ({ type, message }) => {
  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-status-success',
          borderColor: 'border-status-success-border',
          textColor: 'text-green-800',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        };
      case 'warning':
        return {
          bgColor: 'bg-status-warning',
          borderColor: 'border-status-warning-border',
          textColor: 'text-yellow-800',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
        };
      case 'danger':
        return {
          bgColor: 'bg-status-danger',
          borderColor: 'border-status-danger-border',
          textColor: 'text-red-800',
          icon: <XCircle className="w-5 h-5 text-red-600" />,
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          icon: <CheckCircle className="w-5 h-5 text-gray-600" />,
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 min-h-[200px] flex flex-col justify-center">
      <h3 className="text-lg font-semibold text-zinc-900 mb-4">Alert Status</h3>
      
      <div
        className={`p-4 rounded-lg border ${styles.bgColor} ${styles.borderColor}`}
      >
        <div className="flex items-center">
          {styles.icon}
          <span className={`ml-2 font-medium ${styles.textColor}`}>
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};
