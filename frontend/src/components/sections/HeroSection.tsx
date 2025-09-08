import React from 'react';
import { Button } from '../common/Button';

export const HeroSection: React.FC = () => {
  const handleAccessGuidance = () => {
    // Placeholder for future implementation
    console.log('Access Guidance clicked');
  };

  return (
    <section className="bg-primary-800 py-16 lg:py-24" id="hero">
      <div className="container mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in">
          Real-time CPR Guidance for Effective Response
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed animate-slide-up">
          Providing immediate, accurate feedback is crucial for life-saving CPR. Our system helps you perform at your best when it matters most.
        </p>
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={handleAccessGuidance}
            className="inline-flex items-center space-x-2"
          >
            <span>Access Guidance</span>
          </Button>
        </div>
      </div>
    </section>
  );
};
