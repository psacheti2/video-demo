import React, { useState, useEffect } from 'react';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, 
  Palette, ChevronDown, X
} from 'lucide-react';

const TextToolbar = ({ 
  onClose, 
  onFormatChange, 
  currentTextFormat = {},
  position = { top: 50, left: 50 },
  isFullscreen = false // Add this prop
}) => {
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [fontSizeDropdownOpen, setFontSizeDropdownOpen] = useState(false);
  
  // Default text format values
  const {
    fontFamily = 'Arial, sans-serif',
    fontSize = 18,
    fontWeight = 'normal',
    fontStyle = 'normal',
    textDecoration = 'none',
    textAlign = 'center',
    color = '#000000'
  } = currentTextFormat;
  
  const [tempFontSize, setTempFontSize] = useState(fontSize);

  useEffect(() => {
    setTempFontSize(fontSize); // sync when fontSize changes elsewhere
  }, [fontSize]);
  // Font options
  const fontOptions = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Impact', value: 'Impact, sans-serif' }
  ];
  
  // Handle toggle of formatting options
  const handleToggle = (property, value) => {
    onFormatChange({ [property]: value });
  };

  // Determine toolbar position based on fullscreen state
  const getToolbarPosition = () => {
    if (isFullscreen) {
      // For fullscreen mode - position at the top center
      return {
        position: 'absolute',
        top: '60px',              
        left: '50%',            
        transform: 'translateX(-50%)', 
        zIndex: 2000              
      };
    } else {
      // For regular view - position based on passed position or defaults
      return {
        position: 'absolute',
        top: '130px',
        left: '63%',
        transform: position?.left ? 'none' : 'translateX(-50%)',
        zIndex: 1000
      };
    }
  };

  return (
    <div
  className="text-toolbar z-[2000] bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 px-2 py-1 flex flex-wrap items-center gap-2"
  style={{
    ...getToolbarPosition(),
    maxWidth: '90%',
    width: 'max-content',
  }}
>
 {/* Group 1: Bold / Italic / Underline */}
<div className="flex gap-1 items-center border-r border-gray-300 pr-2">
  {/* Bold */}
  <button
    onClick={() => handleToggle('fontWeight', fontWeight === 'bold' ? 'normal' : 'bold')}
    className={`p-1.5 rounded-full border text-[#008080] text-[10px] border-[#008080] transition hover:bg-[#008080] hover:text-white ${
      fontWeight === 'bold' ? 'bg-[#008080] text-white' : ''
    }`}
  >
    <Bold size={14} />
  </button>

  {/* Italic */}
  <button
    onClick={() => handleToggle('fontStyle', fontStyle === 'italic' ? 'normal' : 'italic')}
    className={`p-1.5 rounded-full border text-[#008080] text-[10px] border-[#008080] transition hover:bg-[#008080] hover:text-white ${
      fontStyle === 'italic' ? 'bg-[#008080] text-white' : ''
    }`}
  >
    <Italic size={14} />
  </button>

  {/* Underline */}
  <button
    onClick={() => handleToggle('textDecoration', textDecoration?.includes('underline') ? 'none' : 'underline')}
    className={`p-1.5 rounded-full border text-[#008080] text-[10px] border-[#008080] transition hover:bg-[#008080] hover:text-white ${
      textDecoration?.includes('underline') ? 'bg-[#008080] text-white' : ''
    }`}
  >
    <Underline size={14} />
  </button>
</div>


  {/* Group 3: Font Family + Font Size + Color */}
  <div className="flex gap-1 items-center border-r border-gray-300 pr-2">
    {/* Font Family Dropdown */}
    <div className="relative">
    <button
  onClick={() => {
    setFontMenuOpen(prev => !prev);
    setColorMenuOpen(false);
    setFontSizeDropdownOpen(false);
  }}
  className="flex items-center justify-between px-2 py-1 rounded border border-[#008080] text-[#008080] text-xs hover:bg-[#008080] hover:text-white"
  style={{ width: '120px' }}
>
  <span className="truncate">{fontOptions.find(f => f.value === fontFamily)?.name || 'Font'}</span>
  <ChevronDown size={12} className="ml-1 shrink-0" />
</button>
      {fontMenuOpen && (
        <div className="absolute left-0 mt-1 z-30 bg-white border border-gray-200 rounded shadow max-h-40 overflow-auto w-32 text-xs">
          {fontOptions.map(font => (
            <button
              key={font.name}
              onClick={() => {
                handleToggle('fontFamily', font.value);
                setFontMenuOpen(false);
              }}
              className="w-full px-2 py-1 text-left hover:bg-[#008080] hover:text-white"
              style={{ fontFamily: font.value }}
            >
              {font.name}
            </button>
          ))}
        </div>
      )}
    </div>
{/* Font Size Input & Dropdown */}
<div className="relative flex items-center gap-1">
<input
  type="number"
  value={tempFontSize}
  onChange={(e) => {
    // Store what user is typing — don't apply yet
    setTempFontSize(e.target.value);
  }}
  onInput={(e) => {
    const inputType = e.nativeEvent?.inputType;
    const num = parseInt(e.target.value);
  
    // Handle arrow keys or spinner clicks only
    if (
      inputType === 'insertReplacementText' || 
      inputType === 'insertText' ||           
      inputType === 'deleteContentBackward' || 
      inputType === 'deleteContentForward'
    ) {
      // DO NOTHING – user is typing or deleting
      return;
    }
  
    // For spinner/arrow click changes
    if (!isNaN(num) && num > 0) {
      handleToggle('fontSize', num);
    }
  }}
  
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      const num = parseInt(tempFontSize);
      if (!isNaN(num) && num > 0) {
        handleToggle('fontSize', num);
      }
    } else if (e.key === 'Escape') {
      setTempFontSize(fontSize);
    }
  }}
  onBlur={() => {
    const num = parseInt(tempFontSize);
    if (!isNaN(num) && num > 0) {
      handleToggle('fontSize', num);
    } else {
      setTempFontSize(fontSize);
    }
  }}
  min="8"
  max="200"
  className="w-[60px] px-2 py-1 rounded border border-[#008080] text-[#008080] text-xs focus:outline-none focus:ring-2 focus:ring-[#008080]"
/>


  <button
    onClick={() => {
      setFontMenuOpen(false);
      setColorMenuOpen(false);
      setFontSizeDropdownOpen(prev => !prev);
    }}
    className="px-2 py-1 rounded border border-[#008080] text-[#008080] text-xs hover:bg-[#008080] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#008080]"
    title="Quick Font Sizes"
  >
    <ChevronDown size={12} />
  </button>

  {fontSizeDropdownOpen && (
    <div className="absolute left-0 top-10 z-30 bg-white border border-gray-200 rounded shadow max-h-40 overflow-auto w-24 text-xs">
      {[12, 14, 16, 18, 20, 24, 28, 32, 48, 72, 96, 120].map(size => (
        <button
          key={size}
          onClick={() => {
            setTempFontSize(size);
            handleToggle('fontSize', size);
            setFontSizeDropdownOpen(false);
          }}
          className={`w-full px-2 py-1 text-left hover:bg-[#008080] hover:text-white ${
            parseInt(tempFontSize) === size ? 'bg-[#008080] text-white' : ''
          }`}
        >
          {size}px
        </button>
      ))}
    </div>
  )}
</div>


    <label
      className="flex items-center px-2 py-1 rounded border border-[#008080] text-[#008080] text-xs cursor-pointer hover:bg-[#008080] hover:text-white transition"
      style={{ position: 'relative' }}
    >
      <Palette size={14} className="mr-1" />
      <input
        type="color"
        value={color}
        onChange={(e) => handleToggle('color', e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </label>
  </div>

  {/* Group 4: Close */}
  <div className="flex items-center">
    <button
      onClick={onClose}
      className="ml-1 p-1.5 rounded-full border border-[#008080] text-[#008080] hover:bg-[#008080] hover:text-white transition"
      title="Close"
    >
      <X size={14} />
    </button>
  </div>
</div>


  
  );
};

export default TextToolbar;