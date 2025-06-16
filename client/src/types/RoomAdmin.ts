export interface IRoom {
    id: number;
    roomName: string;
    roomType: string;
    bedType: string;
    amenities: number[];
    roomPrice: number;
    images: File | string;
    status: "Available" | "Maintenance";
    description: string;
    maxGuests: number;
    discount_percent?: number;
}

export interface IRoomFormModalProps {
    isOpen: boolean;
    cancel: () => void;
    onSave: (data: IRoom) => Promise<void>;
    roomData: IRoom | null;
    loading?: boolean;
}