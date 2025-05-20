import { useEffect, useState } from 'react';
import { File, ThumbsUp, ThumbsDown  } from 'lucide-react';
import FilePreviewModal from '../FilePreviewModal';

export default function ChatMessage({ message, isUser, onArtifactClick, isReloading, onFeedback }) {
  const [displayedText, setDisplayedText] = useState(isUser ? message.text : '');
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [feedback, setFeedback] = useState(message.feedback || null); // 'like', 'dislike', or null


  useEffect(() => {
    console.log('Message effect running, isUser:', isUser, 'isReloading:', isReloading);
    
    const isLive = !isUser && !isReloading && !message.id?.startsWith('loaded_');
    
    if (isLive) {
      let index = 0;
      const interval = setInterval(() => {
        index++;
        setDisplayedText(message.text.slice(0, index));
        if (index >= message.text.length) {
          clearInterval(interval);
        }
      }, 15);
      return () => clearInterval(interval);
    } else {
      setDisplayedText(message.text || ''); // Show instantly, handle null/undefined text
    }
  }, [message.text, isUser, isReloading, message.id]);

  // Create file preview URL when component mounts or message.file changes
  useEffect(() => {
    // Clean up any previous URL
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl('');
    }

    // Create new URL if message.file is a File object
    if (message.file && typeof message.file === 'object' && typeof message.file.type === 'string') {
      try {
        const url = URL.createObjectURL(message.file);
        setFilePreviewUrl(url);
        
        // Clean up when component unmounts
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.error('Error creating object URL:', err);
      }
    }
  }, [message.file]);

  // Function to render the file attachment correctly
const renderFileAttachment = () => {
  if (!message.file) return null;
  
  // If file is a string (filename only)
if (typeof message.file === 'string') {
  return (
    <>
      <div 
        className="inline-flex items-center px-2 py-1 mb-2 rounded-md border border-[#00b3b3] bg-[#f0fdfa] shadow-sm cursor-pointer hover:bg-[#dffff9] transition-colors text-xs"
        onClick={() => setShowFilePreview(true)}
      >
        <span className="text-[#007777] font-medium truncate max-w-[120px]">
          {message.file}
        </span>
      </div>
      
      {showFilePreview && (
        <FilePreviewModal 
          file={message.file} 
          onClose={() => setShowFilePreview(false)} 
        />
      )}
    </>
  );
}
  
 // If file is a File object (has name and type properties)
if (typeof message.file === 'object' && message.file !== null && 
  typeof message.file.name === 'string' && 
  typeof message.file.type === 'string') {

const isImage = message.file.type.startsWith('image/');

return (
  <>
    <div 
      className="inline-flex items-center px-2 py-1 mb-2 rounded-md border border-[#00b3b3] bg-[#f0fdfa] shadow-sm cursor-pointer hover:bg-[#dffff9] transition-colors text-xs"
      onClick={() => setShowFilePreview(true)}
    >
      <span className="text-[#007777] font-medium truncate max-w-[120px]">
        {message.file.name}
      </span>
    </div>
    
    {showFilePreview && (
      <FilePreviewModal 
        file={message.file} 
        onClose={() => setShowFilePreview(false)} 
      />
    )}
  </>
);
}
  
  return null;
};

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes || typeof bytes !== 'number') return '';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  return (
    <div className={`flex flex-col mb-6 px-4 md:px-2 w-full ${isUser ? 'items-end' : 'items-start'}`}>
      {/* File Attachment */}
      {renderFileAttachment()}

      <div className="max-w-[75%]">
        {message.contextInfo && (
          <div className="text-sm text-teal-700 mb-1 font-medium italic">
            📍 {message.contextInfo}
          </div>
        )}
        <div
          className={`rounded-lg px-4 py-3 shadow-md break-words ${
            !isUser
              ? 'bg-[#34495E] text-white rounded-br-none'
              : 'bg-gray-100 text-[#34495E] rounded-bl-none'
          }`}
        >
          <p className="whitespace-pre-wrap leading-relaxed">
            {isUser ? (message.text || '') : displayedText}
          </p>
        </div>
      </div>

      {!isUser && (
  <div className="flex mt-1 space-x-2">
    <button
      onClick={() => {
        setFeedback('like');
        onFeedback?.(message.id, 'like');
      }}
      className={`p-1 rounded-full ${
        feedback === 'like' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'
      }`}
      aria-label="Like this message"
    >
      <ThumbsUp size={16} />
    </button>
    <button
      onClick={() => {
        setFeedback('dislike');
        onFeedback?.(message.id, 'dislike');
      }}
      className={`p-1 rounded-full ${
        feedback === 'dislike' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-gray-600'
      }`}
      aria-label="Dislike this message"
    >
      <ThumbsDown size={16} />
    </button>
  </div>
)}

      {!isUser && message.artifacts && message.artifacts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {message.artifacts.map((artifact, index) => (
            <button
              key={index}
              onClick={() => onArtifactClick?.(artifact)}
              className="px-3 py-1 text-sm text-[#008080] border border-[#008080] rounded-full bg-white hover:bg-[#008080] hover:text-white transition"
            >
              {artifact.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}