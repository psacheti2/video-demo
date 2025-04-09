'use client';

import { useEffect, useCallback, useState } from 'react';

/**
 * Controls the staggered flow of artifacts and message updates
 * 
 * @param {Object} props
 * @param {string} props.initialResponse - Initial text to display
 * @param {Array} props.artifactSequence - Array of steps to execute in sequence
 * @param {string} props.messageId - ID of the message being updated
 * @param {Function} props.onUpdate - Callback function to handle updates
 */
export default function ArtifactFlowController({
  initialResponse,
  artifactSequence = [],
  messageId,
  onUpdate
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [displayedArtifacts, setDisplayedArtifacts] = useState([]);
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  // Function to process the next step in the sequence
  const processNextStep = useCallback(() => {
    if (currentStep >= artifactSequence.length) {
      setIsComplete(true);
      return;
    }

    const step = artifactSequence[currentStep];
    
    // Update displayed text if specified
    if (step.text) {
      setDisplayedText(prevText => {
        // If we're replacing text completely
        if (step.replace) {
          return step.text;
        }
        // Otherwise append to existing text
        return prevText + (prevText ? "\n\n" : "") + step.text;
      });
    }
    
    // Add artifacts if specified
    if (step.artifacts && step.artifacts.length > 0) {
      setDisplayedArtifacts(prevArtifacts => [
        ...prevArtifacts,
        ...step.artifacts
      ]);
    }
    
    // Call onUpdate to notify the parent component
    if (onUpdate) {
      onUpdate({
        text: step.replace ? (step.text || "") : (displayedText + (displayedText ? "\n\n" : "") + (step.text || "")),
        artifacts: [...displayedArtifacts, ...(step.artifacts || [])],
        isLoading: currentStep < artifactSequence.length - 1,
        isComplete: currentStep === artifactSequence.length - 1
      });
    }
    
    // Move to the next step
    setCurrentStep(prevStep => prevStep + 1);
  }, [currentStep, artifactSequence, displayedText, displayedArtifacts, onUpdate]);

  // Start the sequence when the component mounts
  useEffect(() => {
    // Set initial response text
    if (initialResponse) {
      setDisplayedText(initialResponse);
      
      // Notify parent component of initial state
      if (onUpdate) {
        onUpdate({
          text: initialResponse,
          artifacts: [],
          isLoading: true,
          isComplete: false
        });
      }
    }
    
    // Start the sequence with a small delay
    const timer = setTimeout(() => {
      processNextStep();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [initialResponse, processNextStep, onUpdate]);

  // Move to the next step after the current delay
  useEffect(() => {
    if (currentStep > 0 && currentStep < artifactSequence.length && !isComplete) {
      const step = artifactSequence[currentStep - 1];
      const delay = step.delay || 2000; // Default 2 seconds
      
      const timer = setTimeout(() => {
        processNextStep();
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, artifactSequence, isComplete, processNextStep]);

  // This component doesn't render anything directly
  return null;
}