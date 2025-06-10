// components/CelebrationFireworks.js

import React, { useEffect, useState } from 'react';

const CelebrationFireworks = ({ isVisible, onComplete, campaignTitle }) => {
  const [particles, setParticles] = useState([]);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Create particles for fireworks effect
      const newParticles = [];
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 2,
          color: ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)]
        });
      }
      setParticles(newParticles);
      setShowMessage(true);

      // Auto-complete after 4 seconds
      const timer = setTimeout(() => {
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm" />
      
      {/* Celebration Message */}
      {showMessage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-md mx-4 animate-bounce">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Campaign Funded!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              "{campaignTitle}" has reached its funding goal!
            </p>
            <div className="flex justify-center gap-2 text-2xl">
              🚀 💰 🎊 🎈 ✨
            </div>
          </div>
        </div>
      )}

      {/* Fireworks Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 rounded-full animate-ping"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}s`,
            animationDuration: '1.5s'
          }}
        />
      ))}

      {/* Floating Emojis */}
      <div className="absolute inset-0">
        {['🎉', '🎊', '🚀', '💰', '🏆', '✨', '🎈', '🌟'].map((emoji, index) => (
          <div
            key={index}
            className="absolute text-4xl animate-bounce"
            style={{
              left: `${10 + index * 12}%`,
              top: `${20 + Math.random() * 60}%`,
              animationDelay: `${index * 0.2}s`,
              animationDuration: '2s'
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Close Button */}
      <button
        onClick={onComplete}
        className="absolute top-8 right-8 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors pointer-events-auto"
      >
        ✕
      </button>
    </div>
  );
};

export default CelebrationFireworks;