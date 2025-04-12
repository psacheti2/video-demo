import { useState } from 'react';
import { Search, Bell, Plus, PanelRight } from 'lucide-react';
import { useNotificationStore } from '@/store/NotificationsStore';

export default function Navbar({ onToggleSidebar, sidebarOpen }) {
  const { notifications, markAllAsRead, clearAllNotifications } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [profileOpen, setProfileOpen] = useState(false);
const toggleProfileDropdown = () => setProfileOpen(!profileOpen);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    if (!dropdownOpen) markAllAsRead();
  };

  return (
<header className="sticky top-0 z-[100]  bg-transparent">
  <div
    className="flex items-center justify-between px-6 py-2"
    style={{
      background: 'linear-gradient(to right, white, transparent 50%, white)',
    }}
  >
    {/* Logo */}
    <div className="flex items-center space-x-2">
 
<button
  onClick={onToggleSidebar}
  className="p-2 rounded-full bg-white border border-gray-300 hover:bg-[#008080]/90 group shadow-sm transition"
  title="Toggle Sidebar"
>
  <PanelRight className="h-5 w-5 text-[#008080] group-hover:text-white" />
</button>

{/* New Chat */}
<button
  className="p-2 rounded-full bg-white border border-gray-300 hover:bg-[#008080]/90 group shadow-sm transition"
  title="New Chat"
>
  <Plus className="h-5 w-5 text-[#008080] group-hover:text-white" />
</button>


  {/* Logo (shift only this) */}
  <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-40' : 'ml-0'}`}>
    <img src="/assets/Logo.svg" alt="Logo" className="h-8" />
  </div>
</div>




    {/* Controls */}
    <div className="flex items-center space-x-2 relative">
      {/* Search */}
      <button className="p-2 rounded-full bg-white border border-gray-300 hover:bg-[#008080]/90 group shadow-sm transition">
        <Search className="h-5 w-5 text-[#008080] group-hover:text-white" />
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={toggleDropdown}
          className="p-2 rounded-full bg-white border border-gray-300 hover:bg-[#008080]/90 group shadow-sm transition relative"
        >
          <Bell className="h-5 w-5 text-[#008080] group-hover:text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#008080] rounded-full animate-ping" />
          )}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-3 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 text-sm overflow-hidden animate-fade-in">
            {notifications.length === 0 ? (
              <div className="p-4 text-gray-500">No notifications</div>
            ) : (
              <>
                <div className="flex justify-between items-center px-4 py-2 border-b bg-[#f0fdfa]">
                  <span className="text-xs font-semibold text-[#008080]">Notifications</span>
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs text-[#008080] hover:underline hover:text-red-500 transition"
                  >
                    Clear All
                  </button>
                </div>
                <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className="px-4 py-2 text-[#008080] hover:bg-[#f0fdfa] transition"
                    >
                      {n.message}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="relative">
  <button
    onClick={toggleProfileDropdown}
    className="w-10 h-10 flex items-center justify-center rounded-full bg-[#008080] text-white font-semibold shadow-sm hover:scale-105 transition"
  >
    JD
  </button>

  {profileOpen && (
    <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 text-sm overflow-hidden animate-fade-in">
      <div className="divide-y divide-gray-100">
        <button className="w-full px-4 py-3 text-left text-[#008080] hover:bg-[#f0fdfa] transition">Settings</button>
        <button className="w-full px-4 py-3 text-left text-[#008080] hover:bg-[#f0fdfa] transition">Privacy</button>
        <button className="w-full px-4 py-3 text-left text-[#008080] hover:bg-[#f0fdfa] transition">Learn More</button>
        <button className="w-full px-4 py-3 text-left text-[#008080] hover:bg-[#f0fdfa] transition">Help & FAQ</button>
      </div>
    </div>
  )}
</div>

    </div>
  </div>
</header>


  );
}
