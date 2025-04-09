import { useState } from "react";

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<"chats" | "saved">("chats");

  const recentChats = [
    { id: 1, title: "Vancouver Flood Analysis", date: "Apr 2, 2025" },
    { id: 2, title: "Infrastructure Budget Planning", date: "Mar 28, 2025" },
    { id: 3, title: "311 Call Data Integration", date: "Mar 22, 2025" },
  ];

  const savedArtifacts = [
    { id: 101, title: "Downtown Risk Index", type: "Map" },
    { id: 102, title: "Floodplain Budget Report", type: "Report" },
    { id: 103, title: "Sidewalk Condition Chart", type: "Chart" },
  ];

  return (
    <aside className="w-64 bg-white text-white flex flex-col absolute h-full left-0 top-16 transition-all duration-300 transform -translate-x-[calc(100%-8px)] hover:translate-x-0 z-10">
      <div className="p-4">
        <button className="w-full py-2 bg-white rounded-lg hover:bg-opacity-90 text-[#34495E] font-medium">
          New Conversation
        </button>
      </div>

      {/* Toggle Tabs */}
<div className="px-4 pb-2 flex space-x-2">
  <button
    onClick={() => setActiveTab("chats")}
    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${
      activeTab === "chats"
        ? "bg-white text-[#006666]"
        : "bg-[#004d4d] text-white hover:bg-[#005c5c]"
    }`}
  >
    Recent
  </button>
  <button
    onClick={() => setActiveTab("saved")}
    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${
      activeTab === "saved"
        ? "bg-white text-[#006666]"
        : "bg-[#004d4d] text-white hover:bg-[#005c5c]"
    }`}
  >
    Saved
  </button>
</div>



      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {activeTab === "chats" ? (
            <ul className="space-y-2">
              {recentChats.map((chat) => (
                <li key={chat.id}>
                  <a
                    href="#"
                    className="block p-2 rounded hover:bg-[#006666] transition-colors duration-200"
                  >
                    <div className="text-sm font-medium truncate">{chat.title}</div>
                    <div className="text-xs text-white opacity-70">{chat.date}</div>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-2">
              {savedArtifacts.map((artifact) => (
                <li key={artifact.id}>
                  <a
                    href="#"
                    className="block p-2 rounded hover:bg-[#006666] transition-colors duration-200"
                  >
                    <div className="text-sm font-medium truncate">{artifact.title}</div>
                    <div className="text-xs text-white opacity-70">{artifact.type}</div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Profile Footer */}
      <div className="p-4 border-t border-[#006666]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-sm font-medium text-[#008080]">JD</span>
          </div>
          <div>
            <div className="text-sm font-medium">John Doe</div>
            <div className="text-xs text-white opacity-70">GIS Analyst</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
