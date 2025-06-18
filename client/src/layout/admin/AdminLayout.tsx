import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? "ml-20" : "ml-72";

  return (
    <div className="bg-gray-50 min-h-screen">
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`transition-all duration-300 ${sidebarWidth} flex-1 min-w-0 p-4`}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
