import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-grow ml-[330px] overflow-y-auto p-4 w-[calc(100% - 330px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
