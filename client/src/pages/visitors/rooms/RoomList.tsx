/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { FC, useMemo } from "react";
import RoomCard from "../../../components/rooms/RoomCard";
import DashboardSkeleton from "../../../motions/skeletons/AdminDashboardSkeleton";
import { fetchAllRooms } from "../../../services/Room";
import Error from "../../_ErrorBoundary";
import { Room } from "../../../types/RoomClient";

interface RoomsResponse {
  data: Room[];
}

const RoomList: FC = () => {
  const { data, isLoading, isError } = useQuery<RoomsResponse>({
    queryKey: ['rooms'],
    queryFn: fetchAllRooms,
  });

  const availableRooms = useMemo(() => {
    if (!data?.data) return [];

    return data.data
      .filter((room: any) => room.status === 'available')
      .map((room: any) => {
        return {
          id: room.id,
          name: room.room_name,
          image: room.room_image,
          title: room.room_type,
          status: room.status,
          description: room.description,
          capacity: room.capacity,
          price: room.room_price,
          discounted_price: room?.discounted_price,
          amenities: room.amenities,
          discount_percent: room.discount_percent || 0,
        };
      });
  }, [data?.data]);

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <Error />

  return (
    <div id="room-list" className="container mx-auto p-6">
      <h2 className="text-center text-3xl sm:text-4xl font-bold mb-6">
        Our Room Accommodations
      </h2>

      {/* Rooms grid or empty state */}
      {availableRooms.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-lg text-gray-600">No rooms available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableRooms.map((room, index) => (
            <div key={index}>
              <RoomCard
                id={room.id}
                name={room.name}
                image={room.image}
                title={room.title}
                price={room.price}
                description={room.description}
                discounted_price={room.discounted_price}
                discount_percent={room.discount_percent > 0 ? room.discount_percent : null}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomList;