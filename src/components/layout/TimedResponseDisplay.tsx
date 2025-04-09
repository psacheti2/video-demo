'use client';

import { useState, useEffect, useRef } from 'react';

interface TimedResponseProps {
  responseText: string;
  timings?: number[];
  onComplete?: () => void;
  className?: string;
}

export default function TimedResponseDisplay({
  responseText,
  timings,
  onComplete,
  className = ''
}: TimedResponseProps) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [showTyping, setShowTyping] = useState(true);
  const responseRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Reset state for new response
    setDisplayedLines([]);
    setShowTyping(true);
    
    // Split text into lines
    const lines = responseText.split('\n').filter(line => line.trim() !== '');
    
    // Use provided timings or default to 2000ms per line
    const lineTimings = timings || Array(lines.length).fill(2000);
    
    // Function to add lines one by one with proper timing
    let lineIndex = 0;
    let timeoutId: NodeJS.Timeout;
    
    const addNextLine = () => {
      if (lineIndex < lines.length) {
        // Add the current line
        setDisplayedLines(prevLines => [...prevLines, lines[lineIndex]]);
        
        // Move to next line
        lineIndex++;
        
        if (lineIndex < lines.length) {
          // If more lines, schedule next line
          timeoutId = setTimeout(addNextLine, lineTimings[lineIndex - 1]);
        } else {
          // No more lines, hide typing indicator and call onComplete
          setShowTyping(false);
          if (onComplete) {
            onComplete();
          }
        }
      }
    };
    
    // Start the first line after initial delay
    timeoutId = setTimeout(() => {
      addNextLine();
    }, lineTimings[0] || 1000);
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
    };
  }, [responseText, timings, onComplete]);
  
  return (
    <div className={`timed-response ${className}`} ref={responseRef}>
      {displayedLines.map((line, index) => (
        <p key={index} className="response-line">
          {line}
        </p>
      ))}
      
      {showTyping && (
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
    </div>
  );
}