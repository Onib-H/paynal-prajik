export interface Area {
    id: number;
    area_name: string;
    area_image: string;
    description?: string;
    capacity: number;
    price_per_hour: number | string;
    status?: "available" | "maintenance";
}

export interface AreasResponse {
    data: Area[];
}

export interface AddAreaResponse {
    data: any;
}

export interface PaginationData {
    total_pages: number;
    current_page: number;
    total_items: number;
    page_size: number;
}