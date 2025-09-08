import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary-900 border-t border-gray-800 py-8">
      <div className="container mx-auto px-6">
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} Heart4Edu System Monitor. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Dikembangkan untuk membantu pelatihan CPR yang lebih efektif
          </p>
        </div>
      </div>
    </footer>
  );
};
