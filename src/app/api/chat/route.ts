// 3. Also make sure to update the ChatInput component to work with this setup
// If needed, modify the ChatInput component to use the onSendMessage callback directly

// 4. Finally, create or update the API route for handling chat messages
// pages/api/chat.ts or app/api/chat/route.ts

import { NextResponse } from 'next/server';
import { chatResponses } from '@/data/chatResponses';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;
    
    // Find a matching mock response
    const response = findMatchingResponse(message);
    
    // Only include artifacts in the response if they exist
    const responseBody: { text: string; artifacts?: any[] } = {
      text: response.text
    };
    
    // Add artifacts to the response only if they exist
    if (response.artifacts && response.artifacts.length > 0) {
      responseBody.artifacts = response.artifacts;
    }
    
    // Return the response
    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function findMatchingResponse(message: string) {
  // Simple keyword matching logic for the mock responses
  for (const [key, response] of Object.entries(chatResponses)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return response;
    }
  }
  
  // Default response if no match found
  return {
    text: "I'm not sure I understand. Could you please rephrase your question?",
  };
}