import React from 'react';
import { Activity, TrendingDown, TrendingUp } from 'lucide-react';

interface StatisticsProps {
  totalCompressions: number;
  percentageDangkal: number;
  percentageDalam: number;
  averageDepth?: number;
}

export const Statistics: React.FC<StatisticsProps> = ({
  totalCompressions,
  percentageDangkal,
  percentageDalam,
  averageDepth,
}) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 min-h-[200px]">
      <h3 className="text-lg font-semibold text-zinc-900 mb-4">Key Statistics</h3>
      
      <div className="space-y-4">
        {/* Total Compressions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="w-5 h-5 text-accent mr-2" />
            <span className="text-sm text-zinc-600">Total Compressions</span>
          </div>
          <span className="text-lg font-semibold text-zinc-900">
            {totalCompressions}
          </span>
        </div>

        {/* Average Depth */}
        {averageDepth !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="w-5 h-5 text-blue-500 mr-2" />
              <span className="text-sm text-zinc-600">Average Depth</span>
            </div>
            <span className="text-lg font-semibold text-blue-600">
              {averageDepth.toFixed(1)} cm
            </span>
          </div>
        )}

        {/* Percentage Dangkal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingDown className="w-5 h-5 text-orange-500 mr-2" />
            <span className="text-sm text-zinc-600">% Dangkal</span>
          </div>
          <span className="text-lg font-semibold text-orange-600">
            {percentageDangkal.toFixed(1)}%
          </span>
        </div>

        {/* Percentage Dalam */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-sm text-zinc-600">% Dalam</span>
          </div>
          <span className="text-lg font-semibold text-red-600">
            {percentageDalam.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};
