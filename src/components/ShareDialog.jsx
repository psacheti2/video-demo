import React, { useState } from 'react';
import { X, Copy, Share, Send } from 'lucide-react';
import { FaXTwitter, FaRedditAlien, FaWhatsapp } from 'react-icons/fa6';

const ShareDialog = ({
  isOpen,
  onClose,
  onShare,
  onShowDownloader = null,
  title = "Share This Map",
  position = { bottom: '60px', right: '16px' }
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [copied, setCopied] = useState(false);

  const suggestedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'purdue.edu'];

  const handleAddEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (
      trimmed &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) &&
      !selectedEmails.includes(trimmed)
    ) {
      setSelectedEmails([...selectedEmails, trimmed]);
    }
    setEmailInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const filteredSuggestions = suggestedDomains
    .filter((domain) => emailInput.includes('@') && domain.startsWith(emailInput.split('@')[1]))
    .map((domain) => emailInput.split('@')[0] + '@' + domain);

  if (!isOpen) return null;

  return (
    <div className="absolute z-[1000]" style={position}>
      <div className="bg-white w-[250px] rounded-2xl shadow-2xl p-6 border border-gray-200 relative animate-fade-in">
        <button className="absolute top-3 right-3 text-gray-400 hover:text-[#008080]" onClick={onClose}>
          <X size={16} />
        </button>

        <h2 className="text-md font-semibold text-[#008080] mb-4">{title}</h2>
        <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 min-h-[38px] mb-2 focus-within:ring-2 focus-within:ring-[#008080]">
  <div className="flex flex-wrap gap-1 items-center flex-1">
    {selectedEmails.map((email) => (
      <span
        key={email}
        className="bg-[#008080]/10 text-[#008080] text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
      >
        {email}
        <button
          onClick={() =>
            setSelectedEmails((prev) => prev.filter((e) => e !== email))
          }
          className="hover:text-red-500"
        >
          <X size={12} />
        </button>
      </span>
    ))}

    <input
      type="text"
      value={emailInput}
      onChange={(e) => setEmailInput(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Enter email..."
      className="flex-1 text-xs focus:outline-none min-w-[80px] bg-transparent"
    />
  </div>

  {/* Share Button inside input */}
  <button
    disabled={selectedEmails.length === 0}
    onClick={() => onShare(selectedEmails)}
    className={`ml-2 p-1.5 rounded-full border ${
      selectedEmails.length > 0
        ? 'border-[#008080] text-[#008080] bg-white hover:bg-[#008080] hover:text-white'
        : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
    } transition`}
    title="Share"
  >
    <Send size={14} />
  </button>
</div>

<div className="flex justify-center gap-6 mt-3">
  {/* X */}
  <div className="flex flex-col items-center group">
    <button
      className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-[black] hover:text-white transition"
      title="Share on X"
    >
      <FaXTwitter size={14} />
    </button>
    <span className="text-[10px] text-gray-500 mt-1 transition group-hover:text-[#008080]">
      X
    </span>
  </div>

  {/* Reddit */}
  <div className="flex flex-col items-center group">
    <button
      className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-[#FF5700] hover:text-white transition"
      title="Share on Reddit"
    >
      <FaRedditAlien size={14} />
    </button>
    <span className="text-[10px] text-gray-500 mt-1 transition group-hover:text-[#008080]">
      Reddit
    </span>
  </div>

  {/* WhatsApp */}
  <div className="flex flex-col items-center group">
    <button
      className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-[#25D366] hover:text-white transition"
      title="Share on WhatsApp"
    >
      <FaWhatsapp size={14} />
    </button>
    <span className="text-[10px] text-gray-500 mt-1 transition group-hover:text-[#008080]">
      WhatsApp
    </span>
  </div>
</div>
<div className="flex items-center my-4">
  <hr className="flex-grow border-gray-300" />
  <span className="mx-3 text-[10px] text-[#008080] font-medium">OR</span>
  <hr className="flex-grow border-gray-300" />
</div>
    
{/* Copy Link + Done */}
<div className="mt-4 flex items-center justify-between space-x-3">
  <button
    onClick={() => {
      navigator.clipboard.writeText('https://example.com/shared/map');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }}
    className="group flex items-center gap-1.5 px-3 py-1 border border-[#008080] text-[#008080] rounded-full bg-white text-xs font-medium hover:bg-[#008080] hover:text-white transition"
  >
    <Copy
      size={14}
      className="text-[#008080] group-hover:text-white transition"
    />
    {copied ? 'Copied!' : 'Copy link'}
  </button>

  <button
    onClick={onClose}
    className="px-4 py-1 rounded-full border border-[#008080] text-[#008080] bg-white text-xs font-medium hover:bg-[#008080] hover:text-white transition"
  >
    Done
  </button>
</div>

        {/* Optional Download Button */}
        {onShowDownloader && (
          <>
            <div className="border-t border-gray-200 my-4"></div>
            <button
  onClick={() => {
    onClose();
    onShowDownloader();
  }}
  className="w-full mt-2 py-1.5 text-xs font-medium rounded-full border border-[#008080] text-[#008080] bg-white hover:bg-[#008080] hover:text-white transition"
>
  Download
</button>

          </>
        )}
      </div>
    </div>
  );
};

export default ShareDialog;