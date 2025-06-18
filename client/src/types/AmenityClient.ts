/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Amenity {
    id: number;
    description: string;
}

export interface PaginatedAmenities {
    data: Amenity[];
    page: number;
    pages: number;
    total: number;
}

export interface AddAmenityResponse {
    data: any;
}