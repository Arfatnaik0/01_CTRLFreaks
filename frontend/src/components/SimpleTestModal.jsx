import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const SimpleTestModal = ({ device, isOpen, onClose }) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        console.log('Modal closing via Escape key');
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !device) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      console.log('Modal closing via backdrop click');
      onClose();
    }
  };

  // Create portal to render modal at the root level
  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      style={{ zIndex: 10000 }}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Test Modal - {device.device_id}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300">
            This is a simple test modal for device: {device.device_id}
          </p>
          <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded">
            <p className="text-sm"><strong>Type:</strong> {device.device_type}</p>
            <p className="text-sm"><strong>Status:</strong> {device.current_status}</p>
            <p className="text-sm"><strong>Relay:</strong> {device.relay_status}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Close Modal
          </button>
        </div>
      </div>
    </div>,
    document.body // Portal target
  );
};

export default SimpleTestModal;