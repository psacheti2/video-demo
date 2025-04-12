import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, SendHorizontal } from 'lucide-react';

export default function WelcomeCard({ onSendMessage }) {
  const [message, setMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() || uploadedFile) {
      onSendMessage({
        text: message,
        file: uploadedFile ? uploadedFile.name : null,
      });
      setMessage('');
      setUploadedFile(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex items-center justify-center h-full p-6 mt-[-4rem]">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-lg p-8 border border-gray-200 transition-all duration-300">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-[#008080] to-[#007878] text-transparent bg-clip-text mb-2">
            Welcome to NeuraCities
          </h2>
          <p className="text-[#2C3E50] text-base">How can I help you?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
  {/* Textarea and Send Button in One Row */}
  <div className="flex items-center gap-2">
    <div className="flex-1 rounded-xl border border-gray-300 px-4 py-3 bg-gray-50 hover:shadow-sm transition">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message here..."
        className="w-full bg-transparent resize-none outline-none min-h-[40px] text-gray-800 placeholder-gray-400"
        rows={1}
      />
    </div>
    <button
  type="submit"
  className="p-2 rounded-full border border-[#008080] hover:bg-[#008080] bg-white group transition-colors"
  title="Send"
>
  <SendHorizontal className="h-4 w-4 text-[#008080] group-hover:text-white" />
</button>
  </div>

  {/* Uploaded File Preview */}
  {uploadedFile && (
    <div className="flex items-center gap-2 p-2 px-4 rounded-xl bg-[#e6fffa] border border-[#008080] text-sm text-[#004d40] shadow-inner transition">
      <FileText className="w-4 h-4" />
      <span className="truncate">{uploadedFile.name}</span>
    </div>
  )}

  {/* Upload Button and Disclaimer */}
  <div className="flex justify-between items-center">
    <label htmlFor="welcome-file-upload" className="cursor-pointer group">
      <div className="p-2 rounded-full border border-[#008080] hover:bg-[#008080] bg-white group transition-colors">
        <Upload className="h-4 w-4 text-[#008080] group-hover:text-white" />
      </div>
      <input
        id="welcome-file-upload"
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        onChange={handleFileUpload}
      />
    </label>

    <p className="text-xs text-gray-400">
      NeuraCities can make mistakes. Double-check responses.
    </p>
  </div>
</form>

      </div>
    </div>
  );
}
