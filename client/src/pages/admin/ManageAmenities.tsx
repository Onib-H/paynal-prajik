/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import EditAmenityModal, { IAmenity } from "../../components/admin/EditAmenityModal";
import Modal from "../../components/Modal";
import ManageRoomLoader from "../../motions/loaders/EventLoader";
import DashboardSkeleton from "../../motions/skeletons/AdminDashboardSkeleton";
import {
  createAmenity,
  deleteAmenity,
  fetchAmenities,
  updateAmenity,
} from "../../services/Admin";
import { Edit, Trash2 } from "lucide-react";
import Error from "../_ErrorBoundary";

interface Amenity {
  id: number;
  description: string;
}

interface PaginatedAmenities {
  data: Amenity[];
  page: number;
  pages: number;
  total: number;
}

interface AddAmenityResponse {
  data: any;
}

const ManageAmenities = () => {
  const [search, setSearch] = useState<string>("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<IAmenity | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAmenityId, setDeleteAmenityId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaderText, setLoaderText] = useState("");

  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  const queryClient = useQueryClient();

  const {
    data: amenitiesResponse,
    isLoading,
    isError,
  } = useQuery<PaginatedAmenities, Error>({
    queryKey: ["amenities", page, pageSize],
    queryFn: fetchAmenities,
  });

  const createAmenityMutation = useMutation<AddAmenityResponse, unknown, { description: string }>({
    mutationFn: createAmenity,
    onMutate: () => {
      setLoading(true);
      setLoaderText("Creating amenity...");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amenities"] });
      setShowFormModal(false);
    },
    onSettled: () => {
      setLoading(false);
      setLoaderText("");
    },
  });

  const updateAmenityMutation = useMutation<
    AddAmenityResponse,
    unknown,
    { amenityId: number; payload: { description: string } }
  >({
    mutationFn: ({ amenityId, payload }) => updateAmenity(amenityId, payload),
    onMutate: () => {
      setLoading(true);
      setLoaderText("Updating amenity...");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amenities"] });
      setShowFormModal(false);
    },
    onSettled: () => {
      setLoading(false);
      setLoaderText("");
    },
  });

  const deleteAmenityMutation = useMutation<any, unknown, number>({
    mutationFn: deleteAmenity,
    onMutate: () => {
      setLoading(true);
      setLoaderText("Deleting amenity...");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amenities"] });
      setShowDeleteModal(false);
    },
    onSettled: () => {
      setLoading(false);
      setLoaderText("");
    },
  });

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <Error />;

  const amenities: Amenity[] = amenitiesResponse?.data || [];

  // Filter amenities based on search and filter criteria
  const filteredAmenities = amenities.filter((amenity: Amenity) => {
    const matchesSearch = amenity.description
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleAddAmenity = () => {
    setSelectedAmenity(null);
    setShowFormModal(true);
  };

  const handleEditAmenity = (amenity: IAmenity) => {
    setSelectedAmenity(amenity);
    setShowFormModal(true);
  };

  const handleDeleteAmenity = (amenityId: number) => {
    setDeleteAmenityId(amenityId);
    setShowDeleteModal(true);
  };

  const confirmDeleteAmenity = () => {
    if (deleteAmenityId !== null) {
      deleteAmenityMutation.mutate(deleteAmenityId);
    }
  };

  const cancelDeleteAmenity = () => {
    setDeleteAmenityId(null);
    setShowDeleteModal(false);
  };

  const handleSaveAmenity = async (amenity: IAmenity) => {
    const payload = { description: amenity.description };
    if (amenity.id === 0) {
      await createAmenityMutation.mutateAsync(payload);
    } else {
      await updateAmenityMutation.mutateAsync({
        amenityId: amenity.id,
        payload,
      });
    }
  };

  return (
    <div className="overflow-y-auto h-[calc(100vh-25px)]">
      <div className="p-3 container mx-auto">
        {/* Loader Overlay */}
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900/80 z-[500]">
            <ManageRoomLoader size="80px" text={loaderText} />
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold">Manage Amenities</h1>
          <button
            onClick={handleAddAmenity}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors duration-300"
          >
            + Add New Amenity
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by description"
            className="p-3 px-6 ring-1 rounded-full w-full md:w-1/2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Grid of Amenity Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredAmenities.map((amenity: Amenity) => (
            <div
              key={amenity.id}
              className="bg-white shadow-md rounded-lg overflow-hidden"
            >
              <div className="p-4 flex flex-col space-y-2">
                {/* Display description as main text */}
                <p className="text-gray-700 text-lg mb-2 line-clamp-4">
                  {amenity.description || "No description provided."}
                </p>
                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditAmenity(amenity)}
                      className="px-3 py-2 uppercase font-semibold bg-green-600 text-white rounded cursor-pointer hover:bg-green-700 transition-colors duration-300"
                    >
                      <Edit size={22} />
                    </button>
                    <button
                      onClick={() => handleDeleteAmenity(amenity.id)}
                      className="px-3 py-2 uppercase font-semibold bg-red-600 text-white rounded cursor-pointer hover:bg-red-700 transition-colors duration-300"
                    >
                      <Trash2 size={22} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {amenitiesResponse && (
          <div className="flex justify-center items-center mt-8 gap-4">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 cursor-pointer bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span>
              Page {amenitiesResponse.page} of {amenitiesResponse.pages}
            </span>
            <button
              onClick={() =>
                setPage((prev) =>
                  prev < amenitiesResponse.pages ? prev + 1 : prev
                )
              }
              disabled={page >= amenitiesResponse.pages}
              className="px-4 py-2 cursor-pointer bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showFormModal && (
          <EditAmenityModal
            isOpen={showFormModal}
            amenityData={selectedAmenity}
            onSave={handleSaveAmenity}
            cancel={() => setShowFormModal(false)}
            loading={
              createAmenityMutation.isPending || updateAmenityMutation.isPending
            }
          />
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          icon="fas fa-trash"
          title="Delete Amenity"
          description="Are you sure you want to delete this amenity?"
          cancel={cancelDeleteAmenity}
          onConfirm={confirmDeleteAmenity}
          className="px-4 py-2 bg-red-600 text-white rounded-md uppercase font-bold hover:bg-red-700 transition-all duration-300"
          cancelText="No"
          confirmText="Delete Amenity"
        />
      </div>
    </div>
  );
};

export default ManageAmenities;
