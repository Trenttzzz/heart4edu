import React from 'react';

interface ModelPredictionProps {
  classIndex: number;
  label: string;
  lastUpdated: string;
  probs?: number[];
}

export const ModelPrediction: React.FC<ModelPredictionProps> = ({
  classIndex,
  label,
  lastUpdated,
  probs,
}) => {
  const classLabels = ['Stabil', 'Ga Stabil', 'Cenderung Atas', 'Cenderung Bawah'];
  
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 min-h-[200px] flex flex-col">
      <h3 className="text-lg font-semibold text-zinc-900 mb-4">Model Prediction</h3>
      
      <div className="text-center flex-1 flex flex-col justify-center">
        <div className="text-4xl font-bold text-primary mb-2">
          {classIndex >= 0 ? classIndex : '-'}
        </div>
        <div className="text-xl font-medium text-zinc-900 mb-4">
          {label}
        </div>
        <div className="text-sm text-zinc-500 mb-4">
          Last updated: {lastUpdated}
        </div>

        {/* Probability Distribution */}
        {probs && probs.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-zinc-700">Probabilities:</h4>
            {probs.map((prob, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-zinc-600">{classLabels[index] || `Class ${index}`}</span>
                <div className="flex items-center">
                  <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                    <div 
                      className="h-2 bg-primary rounded-full" 
                      style={{ width: `${(prob * 100)}%` }}
                    />
                  </div>
                  <span className="font-medium">{(prob * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
