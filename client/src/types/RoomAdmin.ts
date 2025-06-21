export interface IRoom {
  id: number;
  roomName: string;
  roomType: string;
  bedType: string;
  amenities: number[];
  roomPrice: number;
  images: (File | string)[]; // Fixed: each image is a File or a string (URL)
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
