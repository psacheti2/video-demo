import { useEffect, useState } from 'react';

export default function ChatMessage({ message, isUser }) {
  const [displayedText, setDisplayedText] = useState(isUser ? message.text : '');
  
  useEffect(() => {
    if (!isUser) {
      let index = 0;
      const interval = setInterval(() => {
        index++;
        setDisplayedText(message.text.slice(0, index));
        if (index >= message.text.length) {
          clearInterval(interval);
        }
      }, 15); // tweak typing speed here
      return () => clearInterval(interval);
    }
  }, [message.text, isUser]);
  
  return (
    <div className={`flex flex-col mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
      {message.file && (
        <div className="flex items-center gap-2 px-4 py-2 mb-2 rounded-2xl border border-[#00b3b3] bg-[#f0fdfa] shadow-sm max-w-[75%]">
          <span className="text-[#008080] text-base">📎</span>
          <span className="text-sm text-[#007777] font-medium truncate max-w-[180px]">
            {message.file}
          </span>
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-lg px-4 py-3 shadow-md ${
          !isUser
            ? 'bg-[#34495E] text-white rounded-br-none'
            : 'bg-gray-100 text-[#34495E] rounded-bl-none'
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">
          {isUser ? message.text : displayedText}
        </p>
      </div>
    </div>
  );
}