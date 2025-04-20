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
        className="w-15 h-15 rounded-full object-cover"
      />
      <ul className="flex flex-col justify-center">
        <li className="text-gray-700 font-black tracking-wide text-xl">
          {admin.name}
        </li>
      </ul>
    </div>
  );
};

export default AdminProfile;
