import { useState, useRef, useEffect } from 'react';

export function Tooltip({ children, content, delay = 100 }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState('top');
  const childRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Show tooltip with delay
  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
      updatePosition();
    }, delay);
  };
  
  // Hide tooltip
  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };
  
  // Calculate position based on available space
  const updatePosition = () => {
    if (!childRef.current || !tooltipRef.current) return;
    
    const childRect = childRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    // Check available space in each direction
    const spaceAbove = childRect.top;
    const spaceBelow = window.innerHeight - childRect.bottom;
    const spaceLeft = childRect.left;
    const spaceRight = window.innerWidth - childRect.right;
    
    // Default to placing above if there's enough space
    let newPlacement = 'top';
    let top = 0;
    let left = 0;
    
    // Determine best placement
    if (spaceAbove >= tooltipRect.height) {
      // Place above
      newPlacement = 'top';
      top = childRect.top - tooltipRect.height - 5;
      left = childRect.left + (childRect.width / 2) - (tooltipRect.width / 2);
    } else if (spaceBelow >= tooltipRect.height) {
      // Place below
      newPlacement = 'bottom';
      top = childRect.bottom + 5;
      left = childRect.left + (childRect.width / 2) - (tooltipRect.width / 2);
    } else if (spaceRight >= tooltipRect.width) {
      // Place right
      newPlacement = 'right';
      top = childRect.top + (childRect.height / 2) - (tooltipRect.height / 2);
      left = childRect.right + 5;
    } else if (spaceLeft >= tooltipRect.width) {
      // Place left
      newPlacement = 'left';
      top = childRect.top + (childRect.height / 2) - (tooltipRect.height / 2);
      left = childRect.left - tooltipRect.width - 5;
    } else {
      // Not enough space in any direction, center over element
      newPlacement = 'center';
      top = childRect.top + (childRect.height / 2) - (tooltipRect.height / 2);
      left = childRect.left + (childRect.width / 2) - (tooltipRect.width / 2);
    }
    
    // Ensure tooltip stays within viewport
    top = Math.max(5, Math.min(window.innerHeight - tooltipRect.height - 5, top));
    left = Math.max(5, Math.min(window.innerWidth - tooltipRect.width - 5, left));
    
    setPlacement(newPlacement);
    setPosition({ top, left });
  };
  
  // Update position when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (visible) {
        updatePosition();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutRef.current);
    };
  }, [visible]);
  
  return (
    <div 
      className="inline-block relative"
      ref={childRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {visible && (
        <div
          ref={tooltipRef}
          className="absolute z-50 bg-black bg-opacity-80 text-white py-1 px-2 rounded text-xs pointer-events-none"
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            transition: 'opacity 0.1s ease',
            maxWidth: '200px',
            wordWrap: 'break-word',
            whiteSpace: 'normal'
          }}
          data-placement={placement}
        >
          {content}
        </div>
      )}
    </div>
  );
}
