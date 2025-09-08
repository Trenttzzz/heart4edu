import React from 'react';
import { Activity, CheckCircle, Gauge, ArrowUp, ArrowDown } from 'lucide-react';
import { StatusCardData } from '../../types';
import { getStatusColor } from '../../utils';
import { Card } from '../common/Button';

interface StatusCardProps {
  data: StatusCardData;
  index?: number;
}

const iconMap = {
  'compress': Activity,
  'gauge': Gauge,
  'check-circle': CheckCircle,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
};

export const StatusCard: React.FC<StatusCardProps> = ({ data, index = 0 }) => {
  const IconComponent = iconMap[data.icon as keyof typeof iconMap] || Activity;
  const colorClasses = getStatusColor(data.statusType);
  
  return (
    <Card 
      hoverable 
      className={`p-6 text-center animate-fade-in`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className={`text-4xl mb-4 ${data.iconColor}`}>
        <IconComponent className="w-10 h-10 mx-auto" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-3">
        {data.title}
      </h3>
      <span 
        className={`inline-block bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 hover:bg-opacity-30 ${colorClasses}`}
      >
        {data.status}
      </span>
    </Card>
  );
};

interface StatusPanelProps {
  statusData: StatusCardData[];
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ statusData }) => {
  return (
    <section className="bg-primary-800 py-16" id="status-panel">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {statusData.map((data, index) => (
            <StatusCard key={data.id} data={data} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
