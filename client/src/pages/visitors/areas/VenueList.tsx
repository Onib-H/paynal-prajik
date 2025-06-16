import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import VenueCard from "../../../components/areas/VenueCard";
import ContentLoader from "../../../motions/loaders/ContentLoader";
import { fetchAreas } from "../../../services/Area";
import { Area } from "../../../types/AreaClient";

const VenueList = () => {
  const { data: areasData, isLoading, isError } = useQuery<{ data: Area[] }>({
    queryKey: ["venues"],
    queryFn: fetchAreas,
  });

  const [selectedArea, setSelectedArea] = useState<number | null>(null);

  const availableAreas = useMemo(() => {
    if (!areasData?.data) return [];
    return areasData.data.filter(area => area.status === 'available') || [];
  }, [areasData?.data]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h2 className="text-center text-3xl sm:text-4xl font-bold mb-8">
          Select Your Perfect Event Space
        </h2>
        <ContentLoader />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <h2 className="text-center text-3xl sm:text-4xl font-bold mb-8">
          Select Your Perfect Event Space
        </h2>
        <div className="text-center text-red-500">
          Failed to load venues. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-center text-3xl sm:text-4xl font-bold mb-6">
        Select Your Perfect Event Space
      </h2>

      {availableAreas.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-lg text-gray-600">No areas available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableAreas.map((area: Area) => (
            <div
              key={area.id}
              onClick={() => setSelectedArea(selectedArea === area.id ? null : area.id)}
            >
              <VenueCard
                id={area.id}
                title={area.area_name}
                priceRange={area.price_per_hour.toString()}
                image={area.area_image}
                description={area.description}
                discount_percent={area.discount_percent > 0 ? area.discount_percent : null}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VenueList;