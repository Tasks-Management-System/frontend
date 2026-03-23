import { useEffect, useRef, useState } from "react";
import { getUsers } from "../../apis/api/auth";
import Table from "../../components/UI/Table";
import type { User } from "../../types/user.types";

const tabs = [
  { key: "user-management", label: "User Management" },
  { key: "role-management", label: "Role & Access Control" },
  { key: "notifications", label: "Notifications" },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState("user-management");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const { data: users = [], isLoading } = getUsers();

  const columns = [
    {
      key: "name",
      label: "Name",
    },
    {
      key: "email",
      label: "Email",
    },
    {
      key: "role",
      label: "Role",
      render: (row: User) => row.role?.join(", ") || "employee",
    },
    {
      key: "verified",
      label: "Verified",
      render: (row: User) => {
        const isVerified = Boolean((row as any).isEmailVerified);
        return (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {isVerified ? "Yes" : "No"}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row: User) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            row.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
          }`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.key === activeTab);
    const activeElement = tabRefs.current[activeIndex];
    if (!activeElement) return;

    setIndicatorStyle({
      left: activeElement.offsetLeft,
      width: activeElement.offsetWidth,
    });
  }, [activeTab]);

  return (
    <div className="p-3 sm:p-6 bg-gray-50 min-h-screen space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500">
          Manage your company preferences and personal account settings.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
        <div className="relative inline-flex bg-gray-100 p-1 shadow-lg rounded-full">
          <div
            className="absolute top-1 bottom-1 rounded-full bg-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-all duration-300 ease-in-out"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
            }}
          />

          {tabs.map((tab) => (
            <button
              key={tab.key}
              ref={(el) => {
                tabRefs.current[tabs.findIndex((t) => t.key === tab.key)] = el;
              }}
              onClick={() => setActiveTab(tab.key)}
              className={`relative z-10 inline-flex items-center justify-center text-center px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                activeTab === tab.key
                  ? "text-black/90 scale-105"
                  : "text-black/50 hover:text-black/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === "user-management" && (
            <div className="rounded-xl p-4 text-sm text-gray-600">
              {isLoading ? (
                <p className="text-gray-500">Loading users...</p>
              ) : (
                <Table columns={columns} data={users} />
              )}
            </div>
          )}
          {activeTab === "role-management" && (
            <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
              Security settings section coming soon.
            </div>
          )}
          {activeTab === "notifications" && (
            <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
              Notification settings section coming soon.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;