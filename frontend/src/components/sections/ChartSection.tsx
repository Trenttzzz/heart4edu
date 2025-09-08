import React from 'react';
import { BarChart3 } from 'lucide-react';
import { ChartData } from '../../types';
import { Card } from '../common/Button';

interface ChartBarProps {
  data: ChartData;
  index: number;
}

const ChartBar: React.FC<ChartBarProps> = ({ data, index }) => {
  return (
    <div className="flex flex-col items-center group">
      <div 
        className={`${data.color} hover:opacity-80 w-full rounded-t transition-all duration-500 cursor-pointer transform hover:scale-105`}
        style={{ 
          height: `${data.percentage}%`,
          animationDelay: `${index * 0.1}s`
        }}
        title={`${data.category}: ${data.value} compressions`}
      />
      <span className="text-xs text-gray-400 mt-2 text-center group-hover:text-gray-300 transition-colors duration-200">
        {data.category}
      </span>
    </div>
  );
};

interface ChartSectionProps {
  chartData: ChartData[];
}

export const ChartSection: React.FC<ChartSectionProps> = ({ chartData }) => {
  const maxValue = Math.max(...chartData.map(d => d.value));
  const yAxisLabels = [maxValue, Math.floor(maxValue * 0.66), Math.floor(maxValue * 0.33), 0];

  return (
    <section className="bg-primary-800 py-16" id="chart-section">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-purple-400 mr-3" />
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Recent Compressions Distribution
            </h2>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Analisis distribusi kedalaman kompresi untuk memastikan kualitas CPR yang optimal
          </p>
        </div>
        
        <Card className="p-6 lg:p-8">
          <h3 className="text-xl font-semibold text-white mb-8 text-center">
            Compression Depth Frequency
          </h3>
          
          {/* Chart Container */}
          <div className="relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-sm text-gray-400 w-12">
              {yAxisLabels.map((label, index) => (
                <span key={index} className="text-right pr-2">
                  {label}
                </span>
              ))}
            </div>
            
            {/* Chart bars */}
            <div className="ml-16 grid grid-cols-5 gap-4 h-64 items-end">
              {chartData.map((data, index) => (
                <ChartBar key={data.category} data={data} index={index} />
              ))}
            </div>
            
            {/* X-axis line */}
            <div className="ml-16 mt-4 border-t border-gray-600"></div>
          </div>
          
          {/* Chart Legend */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {chartData.map((data) => (
              <div key={data.category} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded ${data.color.replace('bg-', 'bg-')}`}></div>
                <span className="text-sm text-gray-400">{data.category}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
};
