import { StatusCardData, ChartData, SystemStatus } from '../types/index';

export const mockStatusData: StatusCardData[] = [
  {
    id: 'compression-depth',
    title: 'Compression Depth',
    status: 'Tambahkan Tekanan',
    statusType: 'warning',
    icon: 'compress',
    iconColor: 'text-blue-400'
  },
  {
    id: 'compression-rate',
    title: 'Compression Rate',
    status: 'Kurangi Tempo',
    statusType: 'danger',
    icon: 'gauge',
    iconColor: 'text-red-400'
  },
  {
    id: 'overall-status',
    title: 'Overall Status',
    status: 'Baik',
    statusType: 'success',
    icon: 'check-circle',
    iconColor: 'text-green-400'
  }
];

export const mockChartData: ChartData[] = [
  {
    category: '< 40mm',
    value: 15,
    color: 'bg-blue-500',
    percentage: 25
  },
  {
    category: '40-50mm',
    value: 24,
    color: 'bg-purple-500',
    percentage: 40
  },
  {
    category: '50-60mm',
    value: 51,
    color: 'bg-green-500',
    percentage: 85
  },
  {
    category: '60-70mm',
    value: 30,
    color: 'bg-yellow-500',
    percentage: 50
  },
  {
    category: '> 70mm',
    value: 12,
    color: 'bg-red-500',
    percentage: 20
  }
];

export const mockSystemStatus: SystemStatus = {
  compressionDepth: {
    current: 45,
    target: 55,
    status: 'warning',
    message: 'Tambahkan Tekanan'
  },
  compressionRate: {
    current: 125,
    target: 110,
    status: 'danger',
    message: 'Kurangi Tempo'
  },
  overall: {
    status: 'success',
    message: 'Baik'
  }
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const getStatusColor = (status: 'warning' | 'danger' | 'success'): string => {
  const colors = {
    warning: 'text-status-warning bg-status-warning',
    danger: 'text-status-danger bg-status-danger',
    success: 'text-status-success bg-status-success'
  };
  return colors[status];
};

export const smoothScrollTo = (elementId: string): void => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
};
