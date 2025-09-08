import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navClass = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    isHomePage && !isScrolled
      ? 'bg-transparent'
      : 'bg-white/95 backdrop-blur-sm shadow-sm'
  }`;

  const textClass = `transition-colors duration-300 ${
    isHomePage && !isScrolled ? 'text-white' : 'text-zinc-900'
  }`;

  return (
    <nav className={navClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className={`text-xl font-bold ${textClass}`}>
            Heart4Edu
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`hover:text-primary transition-colors ${textClass} ${
                location.pathname === '/' ? 'text-primary font-medium' : ''
              }`}
            >
              Home
            </Link>
            <Link
              to="/monitoring"
              className={`hover:text-primary transition-colors ${textClass} ${
                location.pathname === '/monitoring' ? 'text-primary font-medium' : ''
              }`}
            >
              Monitoring
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className={`md:hidden p-2 ${textClass}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className={`block px-3 py-2 text-zinc-900 hover:text-primary transition-colors ${
                  location.pathname === '/' ? 'text-primary font-medium' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/monitoring"
                className={`block px-3 py-2 text-zinc-900 hover:text-primary transition-colors ${
                  location.pathname === '/monitoring' ? 'text-primary font-medium' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Monitoring
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
