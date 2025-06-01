import { useState, useRef, useEffect } from 'react';
import { Upload, X, SendHorizontal, Eye, File } from 'lucide-react';
import FilePreviewModal from '../FilePreviewModal';

export default function ChatInput({ onSendMessage, setActiveFeedbackMessageId  }) {
  const [message, setMessage] = useState('');
const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
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
  if (message.trim() || uploadedFiles.length > 0) {
    const messagePayload = {
      text: message,
      files: uploadedFiles // Changed from 'file' to 'files' array
    };
    onSendMessage(messagePayload);
    setMessage('');
    setUploadedFiles([]); // Clear array instead of single file
    setActiveFeedbackMessageId(null);
  }
};

  const handleFileUpload = (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'application/x-esri-shape', // .shp
    'application/dbase', // .dbf
    'application/x-shx', // .shx
    'text/plain', // .prj files
    'application/octet-stream', 
    'application/xml',
    'application/geo+json',
    'application/json',
    'text/csv',
    'application/vnd.google-earth.kml+xml',
    'application/xml'
  ];
  
  const isValidFile = (file) => {
    if (allowedTypes.includes(file.type)) return true;
    
    const extension = file.name.toLowerCase().split('.').pop();
    const validExtensions = [
      'pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg',
      'shp', 'dbf', 'shx', 'prj', 'cpg',
      'geojson', 'json', 'csv', 'kml', 'xml'
    ];
    
    return validExtensions?.includes(extension || '');
  };
  
  const validFiles = files.filter(isValidFile);
  const totalFiles = uploadedFiles.length + validFiles.length;
  
  if (totalFiles > 10) {
    alert(`You can only upload up to 10 files. You have ${uploadedFiles.length} files and tried to add ${validFiles.length} more.`);
    return;
  }
  
  if (validFiles.length !== files.length) {
    alert('Some files were skipped. Only supported file types are allowed.');
  }
  
  setUploadedFiles(prev => [...prev, ...validFiles]);
};

  // Handle Enter key to send message (Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      // Only create the thumbnail if we have a valid file
      try {
        return (
          <img 
            src={URL.createObjectURL(uploadedFile)} 
            alt="Thumbnail" 
            className="h-5 w-5 object-cover rounded" 
          />
        );
      } catch (err) {
        // Fallback to File icon if there's an error with thumbnailing
        return <File className="h-5 w-5 text-[#006666]" />;
      }
    }
    return <File className="h-5 w-5 text-[#006666]" />;
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
            className="self-center p-2 rounded-full border border-[#008080] hover:bg-[#008080] bg-white group transition-colors tooltip-bottom"
            data-tooltip="Send"
          >
            <SendHorizontal className="h-4 w-4 text-[#008080] group-hover:text-white" />
          </button>
        </div>

{uploadedFiles.length > 0 && (
  <div className="mt-2 flex flex-wrap gap-2">
    {uploadedFiles.map((file, index) => (
      <div 
        key={index}
        className="inline-flex items-center px-2 py-1 rounded-full border border-[#008080] bg-white text-[#008080] shadow-sm cursor-pointer hover:bg-[#008080] transition-colors text-xs font-medium truncate max-w-[120px] group"
        onClick={() => setShowPreview(true)}
      >
        <span className="truncate group-hover:text-white">{file.name}</span>
        
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setUploadedFiles(prev => prev.filter((_, i) => i !== index));
          }}
          className="p-1 ml-1 rounded-full text-[#008080] transition group-hover:text-white hover:text-red-500"
          data-tooltip="Remove file"
        >
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
)}

        
        <div className="flex justify-between mt-2 items-center">
          <label htmlFor="file-upload" className="cursor-pointer">
            <div 
              className="p-2 rounded-full border border-[#008080] hover:bg-[#008080] bg-white group transition-colors tooltip-right" 
              data-tooltip="Upload file"
            >
              <Upload className="h-4 w-4 text-[#008080] group-hover:text-white" />
            </div>
            <input
  id="file-upload"
  type="file"
  className="hidden"
  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.shp,.dbf,.shx,.prj,.cpg,.geojson,.json,.kml,.kmz,.gml,.csv,.gpx,.zip,.txt,.xml,.xls,.xlsx"
  onChange={handleFileUpload}
  multiple
/>
          </label>
          <div className="text-gray-500 text-xs">
            Neuracities can make mistakes. Please double-check responses.
          </div>
        </div>
      </form>
      
      {showPreview && uploadedFiles.length > 0 && (
  <FilePreviewModal 
    file={uploadedFiles[0]}
    files={uploadedFiles} // Add this line
    onClose={() => setShowPreview(false)} 
  />
)}
    </div>
  );
}