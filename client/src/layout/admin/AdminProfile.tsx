import { FC } from "react";

interface AdminData {
  name: string;
  role: string;
  profile_pic: string;
}

interface AdminProfileProps {
  admin: AdminData;
}

const AdminProfile: FC<AdminProfileProps> = ({ admin }) => {
  return (
    <div className="flex space-x-4 items-center border-b border-b-gray-200 p-2">
      <img
        loading="lazy"
        src={admin.profile_pic}
        alt={admin.profile_pic}
        className="w-20 h-20 rounded-full object-cover"
      />
      <div className="flex flex-col justify-center">
        <h1 className="text-gray-700 font-black tracking-wide text-2xl">
          {admin.name}
        </h1>
        <h2 className="text-gray-500 font-semibold tracking-wide text-md uppercase">
          Role: {admin.role}
        </h2>
      </div>
    </div>
  );
};

export default AdminProfile;
