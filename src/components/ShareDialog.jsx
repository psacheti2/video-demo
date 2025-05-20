import React, { useState } from 'react';
import { X } from 'lucide-react';

const ShareDialog = ({ 
  isOpen, 
  onClose, 
  onShare, 
  onShowDownloader = null, // Optional prop for download button
  title = "Share This Map",
  position = { bottom: '60px', right: '16px' } // New prop for positioning
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeammates, setSelectedTeammates] = useState([]);
  
  // Sample teammates list - in a real app this could come from props or an API
  const teammateList = [
    "Alice Johnson", "Bob Smith", "Catherine Nguyen", "David Li", "Emma Patel"
  ];

  const filteredTeammates = teammateList.filter(name =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div 
      className="absolute z-[1000]"
      style={position}
    >
      <div className="bg-white w-[340px] rounded-2xl shadow-2xl p-6 border border-gray-200 relative animate-fade-in">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <X size={16} />
        </button>

        <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>

        {/* Teammate Search */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 block">Search Teammate</label>
          <input
            type="text"
            placeholder="Type a name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#008080] focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Teammate List */}
        <div className="max-h-40 overflow-y-auto mb-4 space-y-1 pr-1">
          {filteredTeammates.map(teammate => (
            <div
              key={teammate}
              onClick={() => {
                setSelectedTeammates(prev => 
                  prev.includes(teammate)
                    ? prev.filter(t => t !== teammate)
                    : [...prev, teammate]
                );
              }}
              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition border 
                ${selectedTeammates.includes(teammate)
                  ? 'bg-[#008080]/10 border-[#008080]'
                  : 'bg-white hover:bg-gray-50 border-gray-200'}
              `}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#008080]/90 text-white text-sm font-semibold flex items-center justify-center shadow-sm">
                  {teammate.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <span className="text-sm text-gray-800 font-medium">{teammate}</span>
              </div>
              {selectedTeammates.includes(teammate) && (
                <span className="text-xs font-medium text-[#008080]">✓</span>
              )}
            </div>
          ))}
          {filteredTeammates.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-3">No teammates found</div>
          )}
        </div>

        {/* Share Button */}
        <button
          disabled={selectedTeammates.length === 0}
          onClick={() => {
            onShare(selectedTeammates);
          }}
          className={`w-full py-2 rounded-md text-sm font-semibold transition-all duration-200 mb-6
            ${selectedTeammates.length > 0
              ? 'bg-[#008080] text-white hover:bg-teal-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
          `}
        >
          Share
        </button>

        {/* Optional Download Button */}
        {onShowDownloader && (
          <>
            <div className="border-t border-gray-200 my-2"></div>
            <button
              onClick={() => {
                onClose();
                onShowDownloader();
              }}
              className="w-full py-2 rounded-md text-sm font-semibold bg-[#008080] text-white hover:bg-teal-700"
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