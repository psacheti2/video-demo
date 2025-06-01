import { useEffect, useState, useRef } from 'react';
import { File, ThumbsUp, ThumbsDown, X  } from 'lucide-react';
import FilePreviewModal from '../FilePreviewModal';

export default function ChatMessage({ message, isUser, onArtifactClick, isReloading, onFeedback, activeFeedbackMessageId,
  setActiveFeedbackMessageId }) {
  const [displayedText, setDisplayedText] = useState(isUser ? message.text : '');
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [feedback, setFeedback] = useState(message.feedback || null); 
  const isFeedbackOpen = activeFeedbackMessageId === message.id;
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalFeedback, setAdditionalFeedback] = useState('');  
  const [showThankYouBanner, setShowThankYouBanner] = useState(false);
  const prevMessageId = useRef(null);

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

  useEffect(() => {
    if (isFeedbackOpen) {
      const lastMessage = document.querySelector('.chat-container .chat-message:last-child');
      lastMessage?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isFeedbackOpen]);
  
  
  useEffect(() => {
    if (prevMessageId.current !== message.id) {
      setShowThankYouBanner(false);
      setSelectedReason('');
      setAdditionalFeedback('');
      prevMessageId.current = message.id;
    }
  }, [message.id]);
  
  

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

  // Replace the entire renderFileAttachment function with:
const renderFileAttachment = () => {
  // Handle both old single file format and new multiple files format
  const files = message.files || (message.file ? [message.file] : []);
  
  if (!files.length) return null;
  
  return (
    <>
      <div className="mb-2 flex flex-wrap gap-2">
        {files.map((file, index) => {
          // Handle both File objects and string filenames
          const fileName = typeof file === 'string' ? file : file.name;
          const isFileObject = typeof file === 'object' && file !== null;
          
          return (
            <div 
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full border border-[#008080] bg-white text-[#008080] shadow-sm cursor-pointer hover:bg-[#008080] hover:text-white transition-colors text-xs font-medium truncate max-w-[120px]"
              onClick={() => setShowFilePreview(true)}
            >
              <span className="truncate group-hover:text-white">
                {fileName}
              </span>
            </div>
          );
        })}
      </div>
      
      {showFilePreview && files.length > 0 && (
        <FilePreviewModal 
          file={files[0]} // Show first file for now
          onClose={() => setShowFilePreview(false)} 
        />
      )}
    </>
  );
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
        feedback === 'like' ? 'bg-[#008080] text-white' : 'text-gray-400 hover:text-gray-600'
      }`}
      aria-label="Like this message"
    >
      <ThumbsUp size={16} />
    </button>
    <button
      onClick={() => {
        setFeedback('dislike');
        setActiveFeedbackMessageId(message.id);
        setShowThankYouBanner(false);
        onFeedback?.(message.id, 'dislike');
      }}
      className={`p-1 rounded-full ${
        feedback === 'dislike' ? 'bg-[#FF5747] text-white' : 'text-gray-400 hover:text-gray-600'
      }`}
      aria-label="Dislike this message"
    >
      <ThumbsDown size={16} />
    </button>
  </div>
)}
{isFeedbackOpen && (
  <div className="w-full flex justify-center mt-2 relative">
    <div className="w-full max-w-3xl p-4 bg-white/70 border border-[#008080]/20 rounded-xl shadow-md animate-fade-in relative">
      {/* X button */}
      <button
        className="absolute top-3 right-4 text-[#008080] hover:text-[#FF5747] transition"
        onClick={() => setActiveFeedbackMessageId(null)}
        >
        <X size={18} />
      </button>

      <p className="text-sm text-[#008080] mb-3">Tell us more:</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {[
          'Did not fully follow my request',
          'Not factually correct',
          'Incorrect map',
          'Report inaccuracies',
          'Misrepresented chart data',
        ].map((reason) => (
          <button
            key={reason}
            onClick={() => {
              setSelectedReason(reason);
              setActiveFeedbackMessageId(null);              
              setShowThankYouBanner(true);
              setTimeout(() => setShowThankYouBanner(false), 3000); 
            }}
            className={`text-sm px-3 py-1 rounded-full border transition ${
              selectedReason === reason
                ? 'bg-[#008080] text-white border-[#008080]'
                : 'text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white'
            }`}
          >
            {reason}
          </button>
        ))}
      </div>
      <div className="relative w-full">
      <textarea
  value={additionalFeedback}
  onChange={(e) => setAdditionalFeedback(e.target.value)}
  placeholder="(Optional) Feel free to add specific details."
  className="w-full px-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#008080] leading-[1.5rem] overflow-y-hidden"
  style={{
    height: 'auto',
    minHeight: '2.5rem',
    maxHeight: '8rem',
  }}
  rows={1}
  onInput={(e) => {
    const el = e.target;
    el.style.height = 'auto';
    const scrollHeight = el.scrollHeight;
    el.style.height = `${Math.min(scrollHeight, 128)}px`;

    if (scrollHeight > 128) {
      el.style.overflowY = 'auto';
    } else {
      el.style.overflowY = 'hidden';
    }
  }}
/>

  {additionalFeedback.trim() !== '' && (
   <button
   onClick={() => {
     setActiveFeedbackMessageId(null);
     setShowThankYouBanner(true);
     setTimeout(() => setShowThankYouBanner(false), 3000);
     setSelectedReason('');
     setAdditionalFeedback('');
   }}
   className="absolute right-2 top-1/2 -translate-y-1/2 text-sm px-3 py-1 h-auto rounded-md border border-[#008080] text-[#008080] bg-white hover:bg-[#008080] hover:text-white transition whitespace-nowrap"
 >
   Send
 </button>
  
  )}
</div>


    </div>
  </div>
)}

{showThankYouBanner && (
  <div className="w-full flex justify-center mt-2">
    <div className="px-4 py-2 bg-white text-[#008080] border border-[#008080] text-sm rounded-full shadow-md animate-fade-in-out">
      Thanks for your feedback!
    </div>
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