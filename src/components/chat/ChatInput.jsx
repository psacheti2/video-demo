import { useState, useRef, useEffect } from 'react';
import { Upload, X, SendHorizontal} from 'lucide-react';

export default function ChatInput({ onSendMessage }) {
  const [message, setMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const textareaRef = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set the height to the scrollHeight to fit all content
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() || uploadedFile) {
      const messagePayload = {
        text: message,
        file: uploadedFile ? uploadedFile.name : null,
      };
      onSendMessage(messagePayload);
      setMessage('');
      setUploadedFile(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg'
    ];
    if (allowedTypes.includes(file.type)) {
      setUploadedFile(file);
    } else {
      alert('Only PDFs, DOC/DOCX, and images are allowed.');
    }
  };

  // Handle Enter key to send message (Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white/20 p-4">
      <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-2">
  {/* Textarea container with full height and vertical centering */}
  <div className="flex-1 h-full rounded-lg border border-gray-300 bg-white flex items-center px-4 py-2">
    <textarea
      ref={textareaRef}
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Ask NeuraCities..."
      className="w-full resize-none focus:outline-none placeholder-gray-400 pt-1"
      rows={1}
      style={{ lineHeight: '1.5rem' }}
    />
  </div>

  {/* Vertically centered send button */}
  <button
    type="submit"
    className="self-center p-2 rounded-full border border-[#008080] hover:bg-[#008080] bg-white group transition-colors"
    title="Send"
  >
    <SendHorizontal className="h-4 w-4 text-[#008080] group-hover:text-white" />
  </button>
</div>



        {uploadedFile && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-[#f0fdfa] border-2 border-[#008080] rounded-2xl shadow-sm max-w-xs">
            <div className="flex items-center gap-2 text-sm font-medium text-[#006666] truncate">
              <span className="truncate">{uploadedFile.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setUploadedFile(null)}
              className="hover:text-red-500 text-[#008080] transition"
              title="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="flex justify-between mt-2 items-center">
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="p-2 rounded-full border border-[#008080] hover:bg-[#008080] bg-white group transition-colors">
              <Upload className="h-4 w-4 text-[#008080] group-hover:text-white" />
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
            />
          </label>
          <div className="text-gray-500 text-xs">
            Neuracities can make mistakes. Please double-check responses.
          </div>
        </div>
      </form>
    </div>
  );
}