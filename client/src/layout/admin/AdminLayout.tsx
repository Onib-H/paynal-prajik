import { FC } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { useUserContext } from "../../contexts/AuthContext";

const AdminLayout: FC = () => {
  const { role } = useUserContext();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50   ">
      <div className="flex flex-1">
        <AdminSidebar role={role} />
        <main className="flex-grow ml-[330px] overflow-y-auto px-8 py-5 ">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
