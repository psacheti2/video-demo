'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, SendHorizontal, X } from 'lucide-react';
import FilePreviewModal from '../FilePreviewModal';
interface Artifact {
  id: string;
  title: string;
  type: string;
  component: string;
  data: any;
  date: string;
}

interface WelcomeCardProps {
  onSendMessage: (params: { text: string; files: File[] }) => void; 
  savedArtifacts?: Artifact[];
  setModalArtifact?: (artifact: Artifact) => void;
}

export default function WelcomeCard({
  onSendMessage,
  savedArtifacts = [],
  setModalArtifact,
}: WelcomeCardProps) {
  const [message, setMessage] = useState('');
const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
const [previewFiles, setPreviewFiles] = useState<File[] | null>(null);  
const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (message.trim() || uploadedFiles.length > 0) {
    onSendMessage({
      text: message,
      files: uploadedFiles, // Pass the files array
    });
    setMessage('');
    setUploadedFiles([]);
  }
};

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  'application/geo+json',
    'application/geo+json',
    'application/json',
    'text/csv',
    'application/vnd.google-earth.kml+xml',
    'application/xml'
  ];
  
  const isValidFile = (file: File) => {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="flex items-center justify-center h-full p-6 mt-[-4rem]">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-lg p-8 border border-gray-200 transition-all duration-300">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-[#008080] to-[#007878] text-transparent bg-clip-text mb-2">
            Hi Ash!
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
              className="p-2 rounded-full border border-[#008080] hover:bg-[#008080] bg-white group transition-colors tooltip-bottom"
              data-tooltip="Send"
            >
              <SendHorizontal className="h-4 w-4 text-[#008080] group-hover:text-white" />
            </button>
          </div>
{/* Uploaded Files Preview */}
{uploadedFiles.length > 0 && (
  <>
    <div className="flex flex-wrap gap-2">
      {uploadedFiles.map((file, index) => (
        <div 
          key={index}
          className="inline-flex items-center px-2 py-1 rounded-full border border-[#008080] bg-white text-[#008080] shadow-sm cursor-pointer hover:bg-[#008080] transition-colors text-xs font-medium truncate max-w-[120px] group"
          onClick={() => {
            setPreviewFiles(uploadedFiles);
            setShowFilePreview(true);
          }}
        >
          <span className="text-xs font-medium truncate group-hover:text-white">{file.name}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setUploadedFiles(prev => prev.filter((_, i) => i !== index));
            }}
            className="p-1 ml-1 rounded-full group-hover:text-white hover:text-red-500 text-[#008080] transition"
            data-tooltip="Remove file"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
    
    {showFilePreview && previewFiles && (
      <FilePreviewModal 
        file={previewFiles[0]}
        files={previewFiles}
        onClose={() => {
          setShowFilePreview(false);
          setPreviewFiles(null);
        }} 
      />
    )}
  </>
)}

          {/* Upload Button and Disclaimer */}
          <div className="flex justify-between items-center">
            <label htmlFor="welcome-file-upload" className="cursor-pointer group">
            <div 
  className="p-2 rounded-full border border-[#008080] hover:bg-[#008080] bg-white group transition-colors tooltip-bottom" 
  data-tooltip="Upload file"
>
  <Upload className="h-4 w-4 text-[#008080] group-hover:text-white" />
</div>

              <input
  id="welcome-file-upload"
  type="file"
  className="hidden"
  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.shp,.dbf,.shx,.prj,.cpg,.geojson,.json,.csv,.kml,.xml"
  onChange={handleFileUpload}
  multiple
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
