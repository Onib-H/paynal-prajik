export interface Amenity {
    id: number;
    description: string;
}

export interface RoomData {
    id: number;
    room_name: string;
    room_type: string;
    status: string;
    room_price: string;
    room_image: string;
    description: string;
    capacity: string;
    max_guests: number;
    amenities: Amenity[];
}