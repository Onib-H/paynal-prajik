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

export interface IUser {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    password?: string;
    confirm_password: string;
    role: string;
    profile_image?: string;
}

export interface IUserFormModalProps {
    isOpen: boolean;
    cancel: () => void;
    onSave: (user: IUser) => Promise<void>;
    userData?: IUser | null;
    loading?: boolean;
}