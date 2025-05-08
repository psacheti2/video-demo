import { useState, useEffect, Fragment,useRef } from 'react';
import { PanelRight, Search, Plus, MoreVertical, Pencil, Trash2, Share2, X} from 'lucide-react';
import { Dialog, Menu, Transition } from '@headlessui/react';
import { Tooltip } from '../Tooltip';

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
  activeChatId,
}) {
  const [recentChats, setRecentChats] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [chatToShare, setChatToShare] = useState(null);
  const [selectedTeammate, setSelectedTeammate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const inputRefs = useRef({});
  const [shareDialogPosition, setShareDialogPosition] = useState({ x: 0, y: 0 });
  const teammates = ['Alice Chen', 'Bob Smith', 'Cynthia Zhang'];
  const filteredTeammates = teammates.filter(t =>
    t.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('conversations') || '{}');
    const chats = Object.entries(stored).map(([id, convo]) => ({
      id,
      title: convo.messages?.[0]?.text?.slice(0, 40) || 'Untitled Chat',
      date: new Date(convo.lastUpdated).toLocaleDateString(),
    }));
    setRecentChats(chats.reverse()); // Show most recent first
  }, [refreshKey]);

  const handleRenameChat = (chatId) => {
    if (!chatId || !newChatTitle.trim()) return;
  
    const stored = JSON.parse(localStorage.getItem('conversations') || '{}');
    if (stored[chatId]) {
      stored[chatId].customTitle = newChatTitle.trim();
      localStorage.setItem('conversations', JSON.stringify(stored));
  
      setRecentChats(prev =>
        prev.map(chat =>
          chat.id === chatId
            ? { ...chat, title: newChatTitle.trim() }
            : chat
        )
      );
  
      setNewChatTitle('');
    }
  };
  
  const handleDeleteChat = () => {
    if (!chatToDelete) return;

    const stored = JSON.parse(localStorage.getItem('conversations') || '{}');
    if (stored[chatToDelete.id]) {
      // Delete the chat from localStorage
      delete stored[chatToDelete.id];
      localStorage.setItem('conversations', JSON.stringify(stored));
      
      // Update local state to reflect changes
      setRecentChats(prev => prev.filter(chat => chat.id !== chatToDelete.id));

      // If the deleted chat was active, start a new chat
      if (chatToDelete.id === activeChatId) {
        onStartNewChat();
      }

      // Close the dialog
      setDeleteConfirmOpen(false);
      setChatToDelete(null);
    }
  };

  const openRenameDialog = (chat) => {
    setChatToRename(chat);
    setNewChatTitle(chat.title);
    setRenameOpen(true);
  };

  const openDeleteDialog = (chat) => {
    setChatToDelete(chat);
    setDeleteConfirmOpen(true);
  };
  
  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-[150] w-72 h-full bg-[#FFFFFF] bg-opacity-100 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div className="mt-2 px-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="group p-1.5 rounded-full border border-[#008080] text-[#008080] bg-white hover:bg-[#008080]/90 hover:text-white transition shadow-sm tooltip-right"
            data-tooltip="Close Sidebar"
          >
            <PanelRight className="h-5 w-5 text-inherit transition" />
          </button>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="group p-1.5 rounded-full border border-[#008080] text-[#008080] bg-white hover:bg-[#008080]/90 hover:text-white transition shadow-sm tooltip-bottom"
              data-tooltip="Search"
            >
              <Search className="h-5 w-5 text-inherit transition" />
            </button>
            <button
              onClick={() => {
                onStartNewChat();
                onClose();
              }}
              className="group p-1.5 rounded-full border border-[#008080] text-[#008080] bg-white hover:bg-[#008080]/90 hover:text-white transition shadow-sm tooltip-bottom"
              data-tooltip="New Chat"
            >
              <Plus className="h-5 w-5 text-inherit transition" />
            </button>
          </div>
        </div>

        <div className="p-4 flex space-x-2">
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-1 text-sm rounded-lg border transition ${
              activeTab === 'recent'
                ? 'bg-[#008080] text-white border-[#008080]'
                : 'bg-white text-[#008080] border-[#008080]'
            } hover:bg-[#008080] hover:text-white`}
          >
            Recent
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-1 text-sm rounded-lg border transition ${
              activeTab === 'saved'
                ? 'bg-[#008080] text-white border-[#008080]'
                : 'bg-white text-[#008080] border-[#008080]'
            } hover:bg-[#008080] hover:text-white`}
          >
            Saved
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'recent' ? (
            <>
              <ul className="space-y-2">
                {recentChats.map(chat => (
                  <li key={chat.id} className="relative group">
                    <div className="flex items-center">
                    <button
  onClick={() => {
    onClose();
    onLoadConversation(chat.id);
  }}
  className={`group w-[92%] text-left block p-1.5 rounded transition-colors duration-200 ${
    chat.id === activeChatId ? 'bg-[#e0f7f7] text-[#008080]' : 'hover:bg-[#e0f7f7]'
  }`}
>
{editingChatId === chat.id ? (
 <input
 ref={(el) => {
   if (el) inputRefs.current[chat.id] = el;
 }}
 type="text"
 autoFocus
 value={newChatTitle}
 onChange={(e) => setNewChatTitle(e.target.value)}
 onBlur={() => {
   handleRenameChat(chat.id);
   setEditingChatId(null);
 }}
 onKeyDown={(e) => {
   if (e.key === 'Enter') {
     handleRenameChat(chat.id);
     setEditingChatId(null);
   } else if (e.key === 'Escape') {
     setEditingChatId(null);
   }
 }}
 className="text-sm font-medium text-[#2C3E50] bg-white border border-gray-300 rounded px-1 w-full focus:outline-none focus:ring-2 focus:ring-[#008080]"
/>

) : (
  <div className="text-sm font-medium truncate text-[#2C3E50]">
    {chat.title}
  </div>
)}

                        <div className="text-xs text-[#2C3E50]">{chat.date}</div>
                      </button>
                      
                      <Menu as="div" className="relative ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Menu.Button className="p-1 rounded-full hover:bg-[#e0f7f7] text-[#2C3E50]">
                          <MoreVertical className="h-4 w-4" />
                        </Menu.Button>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
<Menu.Items className="absolute right-0 z-10 mt-1 w-40 origin-top-right rounded-md bg-white shadow-lg focus:outline-none">
<div className="py-1">
<Menu.Item>
  {({ active }) => (
    <button
      className={`${
        active ? 'bg-[#e0f7f7] text-[#008080]' : 'text-[#2C3E50]'
      } flex w-full items-center px-4 py-2 text-sm`}
      onClick={() => {
        setEditingChatId(chat.id);
        setNewChatTitle(chat.title);
      
        setTimeout(() => {
          const input = inputRefs.current[chat.id];
          if (input) {
            input.focus();
            input.select(); // 👈 selects the entire text
          }
        }, 0);
      }}
      
    >
      <Pencil className="mr-2 h-4 w-4" />
      Rename
    </button>
  )}
</Menu.Item>


                              <Menu.Item>
  {({ active }) => (
    <button
      className={`${
        active ? 'bg-[#e0f7f7] text-[#008080]' : 'text-[#2C3E50]'
      } flex w-full items-center px-4 py-2 text-sm`}
      onClick={(e) => {
        e.stopPropagation();
        setChatToShare(chat);
        setShareOpen(true);
        setShareDialogPosition({ x: e.clientX, y: e.clientY });
      }}
      
    >
      <Share2 className="mr-2 h-4 w-4" />
      Share
    </button>
  )}
</Menu.Item>

                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    className={`${
                                      active ? 'bg-red-50 text-red-700' : 'text-red-600'
                                    } flex w-full items-center px-4 py-2 text-sm`}
                                    onClick={() => openDeleteDialog(chat)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </button>
                                )}
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
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

      {/* Search Dialog */}
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
                      onLoadConversation(chat.id);
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

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} className="relative z-[200]">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <Dialog.Title className="text-lg font-semibold text-[#008080]">Rename Chat</Dialog.Title>
            <input
              type="text"
              placeholder="Enter new name..."
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRenameOpen(false)}
                className="px-4 py-2 border border-[#008080] text-[#008080] rounded-lg hover:bg-[#f0fdfa] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameChat}
                className="px-4 py-2 bg-[#008080] text-white rounded-lg hover:bg-opacity-90 transition"
                disabled={!newChatTitle.trim()}
              >
                Rename
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {shareOpen && chatToShare && (
  <div
    className="fixed z-[200] w-[260px] bg-white border border-gray-200 shadow-xl rounded-xl p-4 animate-fade-in"
    style={{
      top: `${shareDialogPosition.y}px`,
      left: `${shareDialogPosition.x}px`,
      transform: 'translate(0%, -30%)',
    }}
  >
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-sm font-semibold text-gray-800">Share Chat</h3>
      <button onClick={() => setShareOpen(false)} className="text-gray-400 hover:text-gray-600">
        <X size={16} />
      </button>
    </div>

    <p className="text-xs text-gray-500 mb-2">
      Sharing: <span className="font-medium text-[#008080]">{chatToShare.title}</span>
    </p>

    <input
      type="text"
      placeholder="Search teammate..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full mb-2 px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#008080]"
    />

    <div className="max-h-24 overflow-y-auto space-y-1 pr-1 text-sm">
      {filteredTeammates.map((teammate) => (
        <div
          key={teammate}
          onClick={() => setSelectedTeammate(teammate)}
          className={`px-2 py-1 rounded-md cursor-pointer transition border 
            ${selectedTeammate === teammate
              ? 'bg-[#008080]/10 border-[#008080]'
              : 'hover:bg-gray-50 border-gray-200'}
          `}
        >
          <span className="text-xs text-gray-700">{teammate}</span>
        </div>
      ))}
      {filteredTeammates.length === 0 && (
        <div className="text-xs text-gray-500 text-center py-2">No teammates found</div>
      )}
    </div>

    <button
      disabled={!selectedTeammate}
      onClick={() => {
        setShareOpen(false);
        alert(`Shared "${chatToShare.title}" with ${selectedTeammate}`);
      }}
      className={`w-full mt-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200
        ${selectedTeammate
          ? 'bg-[#008080] text-white hover:bg-teal-700'
          : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
      `}
    >
      Share
    </button>
  </div>
)}



      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} className="relative z-[200]">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
          <Dialog.Title className="text-lg font-semibold text-red-600">Delete Chat</Dialog.Title>
<p className="text-[#2C3E50] text-sm mb-1">
  Are you sure you want to delete this chat?
</p>
<p className="text-sm text-[#008080] font-medium italic mb-4">
  "{chatToDelete?.title || 'Untitled Chat'}"
</p>
<p className="text-xs text-gray-500">This action cannot be undone.</p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-[#008080] text-[#008080] rounded-lg hover:bg-[#f0fdfa] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}