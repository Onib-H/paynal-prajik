import { BookingResponse } from "./BookingClient";

export interface BookingQuery {
    data: BookingResponse[];
    pagination?: {
        total_pages: number;
        current_page: number;
        total_items: number;
        page_size: number;
    };
}