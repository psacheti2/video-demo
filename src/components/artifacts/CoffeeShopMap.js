'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(
  () => import('./CoffeeShopMapComponent'),
  {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center">Loading map...</div>
  }
);

function CoffeeShopMap(props) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Create a stable callback function for sending messages
  const handleSendMessage = useCallback(({ text, file }) => {
    console.log("Attempting to send message:", text);
    
    // First try: Use the prop if available (preferred method)
    if (props.onSendMessage && typeof props.onSendMessage === 'function') {
      console.log("Using props.onSendMessage");
      props.onSendMessage({ text, file });
      return;
    }
    
    // Second try: Look for global chat interface
    if (typeof window !== 'undefined') {
      // Check for various global methods that might exist
      if (window.sendMessageToChat) {
        console.log("Using window.sendMessageToChat");
        window.sendMessageToChat({ text, file });
        return;
      }
      
      // Try to find the chat input in the DOM and programmatically submit
      const chatTextarea = document.querySelector('textarea[placeholder*="Ask"]');
      const sendButton = chatTextarea?.closest('form')?.querySelector('button[type="submit"]');
      
      if (chatTextarea && sendButton) {
        console.log("Found chat interface in DOM");
        // Set the textarea value
        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, "value"
        ).set;
        
        nativeTextAreaValueSetter.call(chatTextarea, text);
        
        // Trigger input event for React to notice the change
        const event = new Event('input', { bubbles: true });
        chatTextarea.dispatchEvent(event);
        
        // Click the send button
        setTimeout(() => {
          sendButton.click();
        }, 100);
        return;
      }
    }
    
    // Fallback: Show error message
    console.warn('No message sending mechanism available');
    alert(`Unable to send question: "${text}" to chat. The chat functionality may not be available.`);
  }, [props.onSendMessage]);
  
  const updatedProps = {
    ...props,
    radius: props.radius || 1,
    onSendMessage: handleSendMessage
  };
  
  return (
    <div className="w-full h-full">
      {isClient ? <MapComponent {...updatedProps} /> : 
        <div className="w-full h-full flex items-center justify-center">
          Initializing map...
        </div>
      }
    </div>
  );
}

export default CoffeeShopMap;