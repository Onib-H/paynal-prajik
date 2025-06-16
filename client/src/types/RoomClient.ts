/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Amenity {
    id: number;
    description: string;
}

export interface Room {
    id: number;
    room_name: string;
    room_image: string;
    room_type: string;
    bed_type: string;
    status: "available" | "occupied" | "maintenance";
    room_price: string | number;
    description: string;
    capacity: string;
    max_guests: number;
    amenities: number[];
    discount_percent?: number;
}

export interface AddRoomResponse {
    data: any;
}

export interface PaginationData {
    total_pages: number;
    current_page: number;
    total_items: number;
    page_size: number;
}

export interface RoomCardProps {
    id: string | number;
    name: string;
    image: string;
    title: string;
    price: string;
    description: string;
    discount_percent?: number;
}