import { useState, useEffect } from 'react';
import { PanelRight, Search, Plus } from 'lucide-react';
import { Dialog } from '@headlessui/react';

export default function Sidebar({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onLoadConversation,
  refreshKey,
  onStartNewChat,
  savedArtifacts = [],
  setModalArtifact,
}) {
  const [recentChats, setRecentChats] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('conversations') || '{}');
    const chats = Object.entries(stored).map(([id, convo]) => ({
      id,
      title: convo.messages?.[0]?.text?.slice(0, 40) || 'Untitled Chat',
      date: new Date(convo.lastUpdated).toLocaleDateString(),
    }));
    setRecentChats(chats.reverse()); // Show most recent first
  }, [refreshKey]);
  
  return (
    <>
    <aside
className={`fixed top-0 left-0 z-[150] w-64 h-full bg-[#FFFFFF] bg-opacity-100 transform transition-transform duration-300 ease-in-out ${        isOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col justify-between`}
    >
      <div className="mt-2 px-4 flex items-center justify-between">
      <button
  onClick={onClose}
  className="group p-1.5 rounded-full border border-[#008080] text-[#008080] bg-white hover:bg-[#008080]/90 hover:text-white transition shadow-sm"
  title="Close Sidebar"
>
  <PanelRight className="h-4 w-4 text-inherit transition" />
</button>


        <div className="flex items-center space-x-1">
        <button
  onClick={() => setSearchOpen(true)}
  className="group p-1.5 rounded-full border border-[#008080] text-[#008080] bg-white hover:bg-[#008080]/90 hover:text-white transition shadow-sm"
  title="Search"
>
  <Search className="h-4 w-4 text-inherit transition" />
</button>
<button
  onClick={() => {
    onStartNewChat();
    onClose();
  }}
  className="group p-1.5 rounded-full border border-[#008080] text-[#008080] bg-white hover:bg-[#008080]/90 hover:text-white transition shadow-sm"
  title="New Chat"
>
  <Plus className="h-4 w-4 text-inherit transition" />
</button>
        </div>
      </div>

      <div className="p-4 flex space-x-2">
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 py-1 text-sm rounded-lg border transition ${
            activeTab === 'recent'
              ?  'bg-[#008080] text-white border-[#008080]'
              :'bg-white text-[#008080] border-[#008080]'
          } hover:bg-[#008080] hover:text-white`}
        >
          Recent
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 py-1 text-sm rounded-lg border transition ${
            activeTab === 'saved'
              ?  'bg-[#008080] text-white border-[#008080]'
              :'bg-white text-[#008080] border-[#008080]'
          } hover:bg-[#008080] hover:text-white`}
        >
          Saved
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'recent' ? (
          <>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#008080] mb-2">
            Recent Chats</h3>
            <ul className="space-y-2">
            {recentChats.map(chat => (
  <li key={chat.id}>
    <button
  onClick={() => {
    onClose();
    onLoadConversation(chat.id);
  }}
  className="group w-full text-left block p-2 rounded transition-colors duration-200 hover:bg-[#008080]/90"
>
  <div className="text-sm font-medium truncate text-[#2C3E50] group-hover:text-white">
    {chat.title}
  </div>
  <div className="text-xs text-[#2C3E50] group-hover:text-white">{chat.date}</div>
</button>

  </li>
))}

            </ul>
          </>
        ) : (
          <>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#008080] mb-2">
Saved Artifacts</h3>
            <ul className="space-y-2">
            {savedArtifacts.map(artifact => (
  <li key={artifact.id}>
    <button
  onClick={() => {
    setModalArtifact?.(artifact);
    onClose();
  }}
  className="group w-full text-left block p-2 rounded transition-colors duration-200 hover:bg-[#008080]/90"
>
  <div className="text-sm font-medium truncate text-[#2C3E50] group-hover:text-white">{artifact.title}</div>
  <div className="text-xs text-[#2C3E50] opacity-70 group-hover:text-white">
    {artifact.type} • {artifact.date}
  </div>
</button>

  </li>
))}
            </ul>
          </>
        )}
      </div>

    </aside>
    <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} className="relative z-[200]">
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
        <Dialog.Title className="text-lg font-semibold text-[#008080]">Search Conversations</Dialog.Title>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
        />
        <ul className="space-y-2 max-h-64 overflow-y-auto">
        {recentChats.filter(chat =>
  chat.title.toLowerCase().includes(searchQuery.toLowerCase())
).map(chat => (
  <li key={chat.id}>
    <button
      onClick={() => {
        setSearchOpen(false);                
        onLoadConversation(chat.id); // load the selected conversation
      }}
      className="w-full text-left block px-4 py-2 rounded hover:bg-[#f0fdfa] transition"
    >
      <div className="text-sm font-medium text-[#008080]">{chat.title}</div>
      <div className="text-xs text-gray-500">{chat.date}</div>
    </button>
  </li>
))}

        </ul>

        <div className="flex justify-end">
          <button
            onClick={() => setSearchOpen(false)}
            className="px-4 py-2 bg-[#008080] text-white rounded-lg hover:bg-opacity-90 transition"
          >
            Close
          </button>
        </div>
      </Dialog.Panel>
    </div>
  </Dialog>
    </>
  );
}
