import { IUser } from "../components/admin/EditUserModal";

export interface CreateUserFormData {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    role: string;
}

export interface PaginationData {
    total_pages: number;
    current_page: number;
    total_items: number;
    page_size: number;
}

export interface UsersResponse {
    data: IUser[];
    pagination: PaginationData;
}