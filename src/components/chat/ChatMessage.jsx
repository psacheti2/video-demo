import { useEffect, useState } from 'react';

export default function ChatMessage({ message, isUser, onArtifactClick }) {
  const [displayedText, setDisplayedText] = useState(isUser ? message.text : '');

  useEffect(() => {
    const isLive = !message.id.startsWith('assistant_') && !message.id.startsWith('error_');

    if (!isUser && isLive) {
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
      setDisplayedText(message.text); // Instantly show full message
    }
  }, [message.text, isUser, message.id]);

  return (
    <div className={`flex flex-col mb-6 px-4 md:px-2 w-full ${isUser ? 'items-end' : 'items-start'}`}>
      {message.file && (
        <div className="flex items-center gap-2 px-4 py-2 mb-2 rounded-2xl border border-[#00b3b3] bg-[#f0fdfa] shadow-sm max-w-[75%]">
          <span className="text-[#008080] text-base">📎</span>
          <span className="text-sm text-[#007777] font-medium truncate max-w-[180px]">
            {message.file}
          </span>
        </div>
      )}

      <div
        className={`max-w-[75%] rounded-lg px-4 py-3 shadow-md break-words ${
          !isUser
            ? 'bg-[#34495E] text-white rounded-br-none'
            : 'bg-gray-100 text-[#34495E] rounded-bl-none'
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">
          {isUser ? message.text : displayedText}
        </p>
      </div>

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
