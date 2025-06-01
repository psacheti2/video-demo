import { useState, useEffect, Fragment,useRef } from 'react';
import { PanelRight, Search, Plus, MoreVertical, Pencil, Trash2, Share2, X, Link, Send, Copy} from 'lucide-react';
import { Dialog, Menu, Transition } from '@headlessui/react';
import { Tooltip } from '../Tooltip';
import { useNotificationStore } from '@/store/NotificationsStore';
import { FaXTwitter, FaRedditAlien, FaWhatsapp } from 'react-icons/fa6';

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
  onUpdateArtifact, 
  onDeleteArtifact,
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
  const [artifactToRename, setArtifactToRename] = useState(null);
const [artifactToDelete, setArtifactToDelete] = useState(null);
const [newArtifactTitle, setNewArtifactTitle] = useState('');
  const [itemToShare, setItemToShare] = useState(null);
  const [itemTypeToShare, setItemTypeToShare] = useState(null); 
  const [selectedTeammates, setSelectedTeammates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const inputRefs = useRef({});
  const [shareDialogPosition, setShareDialogPosition] = useState({ x: 0, y: 0 });
  const teammates = ['Alice Chen', 'Bob Smith', 'Cynthia Zhang'];
  const [editingArtifactId, setEditingArtifactId] = useState(null);
  const [copied, setCopied] = useState(false);
  const addNotification = useNotificationStore((state) => state.addNotification);
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
  const toggleTeammateSelection = (teammate) => {
    setSelectedTeammates(prev => 
      prev.includes(teammate)
        ? prev.filter(t => t !== teammate)
        : [...prev, teammate]
    );
  };

  // Update handleRenameArtifact to actually update the artifact
const handleRenameArtifact = () => {
  if (!artifactToRename || !newArtifactTitle.trim()) return;
  
  // Create updated artifacts array
  const updatedArtifacts = savedArtifacts.map(artifact => 
    artifact.id === artifactToRename.id 
      ? { ...artifact, title: newArtifactTitle.trim() } 
      : artifact
  );
  
  // Add this line to actually save the changes (you may need to adjust this)
  // This would be a prop passed from the parent component, similar to how 
  // onLoadConversation works for chats
  onUpdateArtifact?.(artifactToRename.id, { title: newArtifactTitle.trim() });
  
  // Close the dialog
  setRenameOpen(false);
  setArtifactToRename(null);
  setNewArtifactTitle(''); // Clear the input
};
  
  // Function to open artifact rename dialog
  const openArtifactRenameDialog = (artifact) => {
    setArtifactToRename(artifact);
    setNewArtifactTitle(artifact.title);
    setRenameOpen(true);
  };
  
  const handleDeleteArtifact = () => {
    if (!artifactToDelete) return;
    
    // Call the parent's delete function
    onDeleteArtifact?.(artifactToDelete.id);
    
    // Close the dialog
    setDeleteConfirmOpen(false);
    setArtifactToDelete(null);
  };
  
  // Function to open artifact delete dialog
  const openArtifactDeleteDialog = (artifact) => {
    setArtifactToDelete(artifact);
    setDeleteConfirmOpen(true);
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
        setItemToShare(chat);
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
  <li key={artifact.id} className="relative group">
    <div className="flex items-center">
      <button
        onClick={() => {
          setModalArtifact?.(artifact);
          onClose();
        }}
        className="group w-[92%] text-left block p-1.5 rounded transition-colors duration-200 hover:bg-[#e0f7f7]"
      >
        {editingArtifactId === artifact.id ? (
          // Show edit input when artifact is being edited
          <input
            ref={(el) => {
              if (el) inputRefs.current[artifact.id] = el;
            }}
            type="text"
            autoFocus
            value={newArtifactTitle}
            onChange={(e) => setNewArtifactTitle(e.target.value)}
            onBlur={() => {
              if (newArtifactTitle.trim()) {
                onUpdateArtifact?.(artifact.id, { title: newArtifactTitle.trim() });
              }
              setEditingArtifactId(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (newArtifactTitle.trim()) {
                  onUpdateArtifact?.(artifact.id, { title: newArtifactTitle.trim() });
                }
                setEditingArtifactId(null);
              } else if (e.key === 'Escape') {
                setEditingArtifactId(null);
              }
            }}
            className="text-sm font-medium text-[#2C3E50] bg-white border border-gray-300 rounded px-1 w-full focus:outline-none focus:ring-2 focus:ring-[#008080]"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          // Show normal title when not editing
          <div className="text-sm font-medium truncate text-[#2C3E50]">{artifact.title}</div>
        )}
        <div className="text-xs text-[#2C3E50] opacity-70">
          {artifact.type} • {artifact.date}
        </div>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingArtifactId(artifact.id);
                      setNewArtifactTitle(artifact.title);
                      
                      // Focus and select the input after rendering
                      setTimeout(() => {
                        const input = inputRefs.current[artifact.id];
                        if (input) {
                          input.focus();
                          input.select();
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
         setItemToShare(artifact);
         setItemTypeToShare('artifact');
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
          onClick={(e) => {
            e.stopPropagation();
            openArtifactDeleteDialog(artifact);
          }}
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

<Dialog open={renameOpen} onClose={() => setRenameOpen(false)} className="relative z-[200]">
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
  <div className="fixed inset-0 flex items-center justify-center p-4">
    <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
      <Dialog.Title className="text-lg font-semibold text-[#008080]">
        Rename {artifactToRename ? 'Artifact' : 'Chat'}
      </Dialog.Title>
      <input
        type="text"
        placeholder="Enter new name..."
        value={artifactToRename ? newArtifactTitle : newChatTitle}
        onChange={(e) => 
          artifactToRename 
            ? setNewArtifactTitle(e.target.value) 
            : setNewChatTitle(e.target.value)
        }
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
      />
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => {
            setRenameOpen(false);
            setArtifactToRename(null);
            setChatToRename(null);
          }}
          className="px-4 py-2 border border-[#008080] text-[#008080] rounded-lg hover:bg-[#f0fdfa] transition"
        >
          Cancel
        </button>
        <button
          onClick={artifactToRename ? handleRenameArtifact : handleRenameChat}
          className="px-4 py-2 bg-[#008080] text-white rounded-lg hover:bg-opacity-90 transition"
          disabled={artifactToRename 
            ? !newArtifactTitle.trim() 
            : !newChatTitle.trim()
          }
        >
          Rename
        </button>
      </div>
    </Dialog.Panel>
  </div>
</Dialog>

<Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} className="relative z-[200]">
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
  <div className="fixed inset-0 flex items-center justify-center p-4">
    <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
      <Dialog.Title className="text-lg font-semibold text-red-600">
        Delete {artifactToDelete ? 'Artifact' : 'Chat'}
      </Dialog.Title>
      <p className="text-[#2C3E50] text-sm mb-1">
        Are you sure you want to delete this {artifactToDelete ? 'saved artifact' : 'chat'}?
      </p>
      <p className="text-sm text-[#008080] font-medium italic mb-4">
        "{artifactToDelete?.title || chatToDelete?.title || 'Untitled'}"
      </p>
      <p className="text-xs text-gray-500">This action cannot be undone.</p>

      <div className="flex justify-end space-x-2">
        <button
          onClick={() => {
            setDeleteConfirmOpen(false);
            setArtifactToDelete(null);
            setChatToDelete(null);
          }}
          className="px-4 py-2 border border-[#008080] text-[#008080] rounded-lg hover:bg-[#f0fdfa] transition"
        >
          Cancel
        </button>
        <button
          onClick={artifactToDelete ? handleDeleteArtifact : handleDeleteChat}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Delete
        </button>
      </div>
    </Dialog.Panel>
  </div>
</Dialog>

{shareOpen && itemToShare && (
  <div
    className="fixed z-[200] w-[250px] bg-white border border-gray-200 shadow-xl rounded-xl p-4 animate-fade-in"
    style={{
      top: `${shareDialogPosition.y}px`,
      left: `${shareDialogPosition.x}px`,
      transform: 'translate(0%, -30%)',
    }}
  >
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-sm font-semibold text-[#008080]">
        Share {itemTypeToShare === 'artifact' ? 'Artifact' : 'Chat'}
      </h3>
      <button
  onClick={() => {
    setShareOpen(false);
    setSelectedTeammates([]);
    setSearchTerm('');
  }}
  className="text-gray-400 hover:text-[#008080]"
>
  <X size={16} />
</button>

    </div>
    <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 min-h-[38px] mb-2 focus-within:ring-2 focus-within:ring-[#008080]">
  <div className="flex flex-wrap gap-1 items-center flex-1">
    {selectedTeammates.map((email) => (
      <span
        key={email}
        className="bg-[#008080]/10 text-[#008080] text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
      >
        {email}
        <button
          onClick={() =>
            setSelectedTeammates((prev) => prev.filter((e) => e !== email))
          }
          className="hover:text-red-500"
        >
          <X size={12} />
        </button>
      </span>
    ))}

    <input
      type="text"
      placeholder="Enter email..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      onKeyDown={(e) => {
        if (
          (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(searchTerm.trim())
        ) {
          e.preventDefault();
          const email = searchTerm.trim().toLowerCase();
          if (!selectedTeammates.includes(email)) {
            setSelectedTeammates([...selectedTeammates, email]);
          }
          setSearchTerm('');
        }
      }}
      className="flex-1 text-xs focus:outline-none min-w-[80px] bg-transparent"
    />
  </div>

  <button
    disabled={selectedTeammates.length === 0}
    onClick={() => {
      const message = `Shared ${itemTypeToShare === 'artifact' ? 'artifact' : 'chat'} "${itemToShare.title}" with ${selectedTeammates.join(', ')}`;
      addNotification(message);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: message }));
      setSelectedTeammates([]);
      setSearchTerm('');
      setShareOpen(false);
    }}
    className={`ml-2 p-1.5 rounded-full border ${
      selectedTeammates.length > 0
        ? 'border-[#008080] text-[#008080] bg-white hover:bg-[#008080] hover:text-white'
        : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
    } transition`}
    title="Send"
  >
    <Send size={14} />
  </button>
</div>
<div className="flex justify-center gap-6 mt-3">
  {/* X */}
  <div className="flex flex-col items-center group">
    <button
      className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-black hover:text-white transition"
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
    

    <div className="mt-4 flex items-center justify-between space-x-3">
  
    <button
  onClick={() => {
    navigator.clipboard.writeText('https://example.com/shared/item');
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
    onClick={() => {
      setShareOpen(false);
      setSearchTerm('');
      setSelectedTeammates([]);
    }}
    className="px-4 py-1 rounded-full border border-[#008080] text-[#008080] bg-white text-xs font-medium hover:bg-[#008080] hover:text-white transition"
  >
    Done
  </button>
</div>

  </div>
)}

     
    </>
  );
}