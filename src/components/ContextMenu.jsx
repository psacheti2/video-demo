import { Fragment, useState } from 'react';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { MoreVertical, Pencil, Share2, Trash2, X } from 'lucide-react';

export default function ContextMenu({ 
  chat,
  onInlineRename,
  onDeleteComplete,
  onShareComplete
}) {
  // State for dialogs
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareDialogPosition, setShareDialogPosition] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeammate, setSelectedTeammate] = useState('');
  
  // Mock teammates data - in a real app, this might come from props or an API
  const teammates = ['Alice Chen', 'Bob Smith', 'Cynthia Zhang'];
  const filteredTeammates = teammates.filter(t =>
    t.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleOpenInlineRename = () => {
    onInlineRename(chat.id);
  };

  const handleOpenDelete = () => {
    setDeleteConfirmOpen(true);
  };
  
  const handleOpenShare = (e) => {
    setShareOpen(true);
    setShareDialogPosition({ x: e.clientX, y: e.clientY });
  };
  
  const handleDeleteChat = () => {
    onDeleteComplete(chat.id);
    setDeleteConfirmOpen(false);
  };
  
  const handleShareChat = () => {
    if (!selectedTeammate) return;
    
    onShareComplete(chat.id, selectedTeammate);
    setShareOpen(false);
    setSelectedTeammate('');
    setSearchTerm('');
  };

  return (
    <>
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
                    onClick={handleOpenInlineRename}
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
                      handleOpenShare(e);
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
                    onClick={handleOpenDelete}
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
              "{chat?.title || 'Untitled Chat'}"
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

      {/* Share Dialog */}
      {shareOpen && (
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
            Sharing: <span className="font-medium text-[#008080]">{chat?.title}</span>
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
            onClick={handleShareChat}
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
    </>
  );
}