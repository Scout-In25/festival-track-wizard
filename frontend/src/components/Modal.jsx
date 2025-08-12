import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  ariaLabelledBy,
  ariaDescribedBy,
  maxWidth = '600px',
  maxHeight = '80vh'
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);
  const isClosingRef = useRef(false);
  const originalBodyOverflow = useRef(null);

  // Store the previously focused element when modal opens
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      
      // Store original body overflow style
      originalBodyOverflow.current = document.body.style.overflow || '';
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Focus the modal after a brief delay to ensure it's rendered
      const timer = setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      // Restore body scroll - use stored original value or empty string
      document.body.style.overflow = originalBodyOverflow.current || '';
      
      // Return focus to previously focused element if not closing programmatically
      if (!isClosingRef.current && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
      isClosingRef.current = false;
    }
  }, [isOpen]);

  // Cleanup effect: ensure body overflow is restored on unmount
  useEffect(() => {
    return () => {
      // Force restore body overflow when component unmounts
      if (originalBodyOverflow.current !== null) {
        document.body.style.overflow = originalBodyOverflow.current;
      } else {
        // Fallback: remove any overflow styling
        document.body.style.overflow = '';
      }
    };
  }, []);

  // Utility function to ensure body overflow is restored
  const ensureBodyOverflowRestored = useCallback(() => {
    if (originalBodyOverflow.current !== null) {
      document.body.style.overflow = originalBodyOverflow.current;
    } else {
      document.body.style.overflow = '';
    }
  }, []);

  // Handle ESC key
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      ensureBodyOverflowRestored();
      onClose();
    }
    
    // Focus trap: keep focus within modal
    if (event.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (event.shiftKey) {
        // Shift + Tab: if focus is on first element, move to last
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if focus is on last element, move to first
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [onClose, ensureBodyOverflowRestored]);

  // Add/remove event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Handle backdrop click
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      ensureBodyOverflowRestored();
      onClose();
    }
  };

  // Programmatic close (for animations)
  const handleClose = () => {
    isClosingRef.current = true;
    ensureBodyOverflowRestored();
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="modal-backdrop"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        animation: 'modalFadeIn 0.2s ease-out',
        touchAction: 'none' // Prevent touch actions on backdrop
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy || 'modal-title'}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          maxWidth: maxWidth,
          maxHeight: maxHeight,
          width: '100%',
          overflow: 'hidden',
          outline: 'none',
          animation: 'modalSlideIn 0.2s ease-out',
          position: 'relative',
          touchAction: 'manipulation' // Allow touch actions but prevent double-tap zoom
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px 0'
        }}>
          <h2 
            id={ariaLabelledBy || 'modal-title'}
            style={{
              margin: '0 0 8px 0',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#2c3e50'
            }}
          >
            {title}
          </h2>
          
          <button
            onClick={handleClose}
            aria-label="Sluit modal"
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
              e.target.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#6b7280';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div 
          style={{
            padding: '0',
            maxHeight: `calc(${maxHeight} - 100px)`,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch', // iOS momentum scrolling
            touchAction: 'pan-y', // Allow vertical scrolling only
            overscrollBehavior: 'contain' // Prevent scroll chaining
          }}
          id={ariaDescribedBy}
        >
          {children}
        </div>
      </div>
    </div>
  );

  // Render modal in a portal
  return createPortal(modalContent, document.body);
};

export default Modal;