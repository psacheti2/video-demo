import { useState, useRef, useEffect  } from 'react';
import { Search, Bell, Plus, PanelRight, X } from 'lucide-react';
import { useNotificationStore } from '@/store/NotificationsStore';

export default function Navbar({ onToggleSidebar, sidebarOpen, onStartNewChat }) {
  const { notifications, markAllAsRead, clearAllNotifications, removeNotification } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [profileOpen, setProfileOpen] = useState(false);
const toggleProfileDropdown = () => setProfileOpen(!profileOpen);
const notificationRef = useRef(null);
const profileRef = useRef(null);
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    if (!dropdownOpen) markAllAsRead();
  };
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
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
  className="p-2 rounded-full bg-white border border-[#008080] hover:bg-[#008080]/90 group shadow-sm transition"
  data-tooltip="Toggle Sidebar"
>
  <PanelRight className="h-5 w-5 text-[#008080] group-hover:text-white" />
</button>

{/* New Chat */}
<button
  onClick={onStartNewChat}
  className="p-2 rounded-full bg-white border border-[#008080] hover:bg-[#008080]/90 group shadow-sm transition tooltip-bottom"
  data-tooltip="New Chat"
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
      
    <div className="relative" ref={notificationRef}>

    {/* Notifications */}
<div className="relative">
  <button
    onClick={toggleDropdown}
    className="p-2 rounded-full bg-white border border-[#008080] hover:bg-[#008080]/90 group shadow-sm transition relative tooltip-bottom"
    data-tooltip="Notifications"
  >
    <Bell className="h-5 w-5 text-[#008080] group-hover:text-white" />
    {unreadCount > 0 && (
      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF5747] rounded-full" />
    )}
  </button>

  {dropdownOpen && (
    <div className="absolute right-0 mt-3 w-72 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 text-sm overflow-hidden animate-fade-in">
      <div className="px-4 py-3 bg-[#f0fdfa] flex justify-between items-center">
        <span className="text-sm font-medium text-[#008080] tracking-wide">Notifications</span>
        <button
          onClick={clearAllNotifications}
          className="text-xs text-[#008080] hover:text-red-500 transition font-medium"
        >
          Clear All
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="p-4 text-gray-400 text-center text-sm">No new notifications </div>
      ) : (
<ul className="max-h-72 overflow-y-auto space-y-1 px-2 py-2">
{notifications.map((n) => (
            <li
              key={n.id}
              className="px-3 py-2 rounded-lg text-[#008080] hover:bg-[#f0fdfa] transition-all relative group flex items-start gap-2"
              >
              <span className="flex-1 leading-snug">{n.message}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(n.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )}
</div>
</div>

<div className="relative" ref={profileRef}>

      {/* Profile */}
      <div className="relative">
  <button
    onClick={toggleProfileDropdown}
    className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#008080] border border-[#008080] hover:bg-[#008080]/90 hover:text-white font-semibold shadow-sm hover:scale-105 transition tooltip-bottom"
    data-tooltip="Profile"
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
  </div>
</header>


  );
}
