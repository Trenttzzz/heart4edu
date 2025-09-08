export interface StatusCardData {
  id: string;
  title: string;
  status: string;
  statusType: 'warning' | 'danger' | 'success';
  icon: string;
  iconColor: string;
}

export interface ChartData {
  category: string;
  value: number;
  color: string;
  percentage: number;
}

export interface CompressionData {
  depth: number;
  rate: number;
  timestamp: Date;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface SystemStatus {
  compressionDepth: {
    current: number;
    target: number;
    status: 'warning' | 'danger' | 'success';
    message: string;
  };
  compressionRate: {
    current: number;
    target: number;
    status: 'warning' | 'danger' | 'success';
    message: string;
  };
  overall: {
    status: 'warning' | 'danger' | 'success';
    message: string;
  };
}

export interface NavigationItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

// CPR Backend Integration Types
export interface CPRPrediction {
  class_index: number;
  class_label: string;
  probs: number[];
  timestamp?: Date;
}

export interface DepthDataPoint {
  time: number;
  depth: number;
  timestamp: Date;
}

export interface CPRSession {
  id: string;
  startTime: Date;
  isActive: boolean;
  totalCompressions: number;
}

export interface CPRAlert {
  type: 'success' | 'warning' | 'danger';
  message: string;
  timestamp: Date;
}
