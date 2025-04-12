'use client';

import { useState } from 'react';
import { PanelRight, Search, Plus } from 'lucide-react';
import { Dialog } from '@headlessui/react';


export default function Sidebar({ isOpen, onClose, activeTab, setActiveTab }) {
  const recentChats = [
    { id: 1, title: "Vancouver Flood Analysis", date: "Apr 2, 2025" },
    { id: 2, title: "Infrastructure Budget Planning", date: "Mar 28, 2025" },
    { id: 3, title: "311 Call Data Integration", date: "Mar 22, 2025" },
  ];
  

  const savedArtifacts = [
    { id: 'a1', title: 'Infrastructure Flood Map', type: 'Map', date: 'Apr 9, 2025' },
    { id: 'a2', title: 'Risk Index Map', type: 'Map', date: 'Apr 9, 2025' },
  ];
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <>
    <aside
      className={`fixed top-0 left-0 z-[150] w-64 h-full bg-[#008080] transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col justify-between`}
    >
      <div className="mt-2 px-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-1.5 rounded-full bg-white border border-gray-300 hover:bg-[#008080]/90 group shadow-sm transition"
          title="Close Sidebar"
        >
          <PanelRight className="h-4 w-4 text-[#008080] group-hover:text-white" />
        </button>

        <div className="flex items-center space-x-1">
          <button
onClick={() => setSearchOpen(true)}
className="p-1.5 rounded-full bg-white border border-gray-300 hover:bg-[#008080]/90 group shadow-sm transition"
            title="Search"
          >
            <Search className="h-4 w-4 text-[#008080] group-hover:text-white" />
          </button>
          <button
            className="p-1.5 rounded-full bg-white border border-gray-300 hover:bg-[#008080]/90 group shadow-sm transition"
            title="New Chat"
          >
            <Plus className="h-4 w-4 text-[#008080] group-hover:text-white" />
          </button>
        </div>
      </div>

      <div className="p-4 flex space-x-2">
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 py-1 text-sm rounded-lg transition ${
            activeTab === 'recent' ? 'bg-white text-[#008080]' : 'bg-[#006666] text-white'
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 py-1 text-sm rounded-lg transition ${
            activeTab === 'saved' ? 'bg-white text-[#008080]' : 'bg-[#006666] text-white'
          }`}
        >
          Saved
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'recent' ? (
          <>
            <h3 className="text-xs uppercase tracking-wider text-white opacity-80 mb-2">Recent Chats</h3>
            <ul className="space-y-2">
              {recentChats.map(chat => (
                <li key={chat.id}>
                  <div className="block p-2 rounded hover:bg-[#f0fdfa] transition-colors duration-200 group">
                    <div className="text-sm font-medium text-white truncate group-hover:text-[#008080]">{chat.title}</div>
                    <div className="text-xs text-white group-hover:text-[#008080]">{chat.date}</div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h3 className="text-xs uppercase tracking-wider text-white opacity-80 mb-2">Saved Artifacts</h3>
            <ul className="space-y-2">
              {savedArtifacts.map(artifact => (
                <li key={artifact.id}>
                  <div className="block p-2 rounded hover:bg-[#006666] transition-colors duration-200">
                    <div className="text-sm font-medium truncate text-white">{artifact.title}</div>
                    <div className="text-xs text-white opacity-70">{artifact.type} • {artifact.date}</div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="p-4 border-t border-[#006666] space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-sm font-medium text-[#008080]">JD</span>
          </div>
          <div>
            <div className="text-sm text-white font-medium">John Doe</div>
          </div>
        </div>
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
              <div className="block px-4 py-2 rounded hover:bg-[#f0fdfa] transition">
                <div className="text-sm font-medium text-[#008080]">{chat.title}</div>
                <div className="text-xs text-gray-500">{chat.date}</div>
              </div>
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
