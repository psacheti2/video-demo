import { NextResponse } from 'next/server';
import { chatResponses } from '@/data/chatResponses';

// Define the response type to match what's in chatResponses
interface ResponseData {
  text: string;
  artifacts?: Array<{
    type: string;
    title: string;
    component: string;
    data: any;
  }>;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    // Find a matching mock response
    const response = findMatchingResponse(message);

    // Only include artifacts in the response if they exist
    const responseBody: ResponseData = {
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

function findMatchingResponse(message: string): ResponseData {
  // Simple keyword matching logic for the mock responses
  for (const [key, response] of Object.entries(chatResponses)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return response as ResponseData;
    }
  }

  // Default response if no match found
  return {
    text: "I'm not sure I understand. Could you please rephrase your question?",
    artifacts: [] // Add empty artifacts array to default response
  };
}