import { FC } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { useUserContext } from "../../contexts/AuthContext";

const AdminLayout: FC = () => {
  const { role } = useUserContext();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1">
        <AdminSidebar role={role} />
        <main className="flex-grow bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
