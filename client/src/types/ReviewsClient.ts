export interface ReviewData {
    id: string | number;
    user_profile_image: string;
    user_name: string;
    formatted_date: string;
    rating: number;
    review_text: string;
    booking_details?: {
        type: string;
        name: string;
        check_in_date: string;
        check_out_date: string;
    }
}