export interface IAmenity {
    id: number;
    description: string;
}

export interface IEditAmenityModalProps {
    isOpen: boolean;
    amenityData: IAmenity | null;
    onSave: (amenity: IAmenity) => Promise<void>;
    cancel: () => void;
    loading?: boolean;
}