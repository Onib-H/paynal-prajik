/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, ArrowLeft as LeftArrow, MapPin, PhilippinePeso, Star, Users } from "lucide-react";
import { lazy, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReviewList from "../components/reviews/ReviewList";
import { useUserContext } from "../contexts/AuthContext";
import { fetchAreaDetail, fetchAreas } from "../services/Area";
import { fetchAreaReviews } from "../services/Booking";
import { Area } from "../types/AreaClient";

const LoadingDashboard = lazy(() => import("../motions/skeletons/AdminDashboardSkeleton"));
const Error = lazy(() => import("./_ErrorBoundary"));

const VenueDetails = () => {
    const { id } = useParams<{ id: string }>();
    const { isAuthenticated } = useUserContext();
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    const {
        data: venueData,
        isLoading: isLoadingVenue,
        error: venueError,
    } = useQuery<{ data: Area }>({
        queryKey: ["venue", id],
        queryFn: () => fetchAreaDetail(Number(id)),
        enabled: !!id,
    });

    const { data: allVenuesData } = useQuery<{ data: Area[] }>({
        queryKey: ["venues"],
        queryFn: fetchAreas as any,
    });

    const {
        data: reviewsData,
        isLoading: isLoadingReviews,
        error: reviewsError
    } = useQuery({
        queryKey: ["areaReviews", id],
        queryFn: () => fetchAreaReviews(id as string),
        enabled: !!id,
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (isLoadingVenue) return <LoadingDashboard />;
    if (venueError) return <Error />;

    const venueDetail = venueData?.data;
    if (!venueDetail) {
        return <div className="text-center mt-4">No venue details available</div>;
    }

    const allVenues = allVenuesData?.data || [];
    const currentIndex = allVenues.findIndex((venue: any) => venue.id === Number(id));
    const prevVenue = currentIndex > 0 ? allVenues[currentIndex - 1] : null;
    const nextVenue = currentIndex < allVenues.length - 1 ? allVenues[currentIndex + 1] : null;

    const reviews = reviewsData?.data || [];

    const formattedPrice = typeof venueDetail.price_per_hour === 'string'
        ? venueDetail.price_per_hour.startsWith('₱')
            ? venueDetail.price_per_hour
            : `${venueDetail.price_per_hour}`
        : `${venueDetail.price_per_hour}`;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                delayChildren: 0.3,
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 80,
                damping: 15
            }
        }
    };

    const imageVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 60,
                damping: 20,
                duration: 0.6
            }
        }
    };

    const navButtonVariants = {
        initial: { opacity: 0.7, scale: 1 },
        hover: { opacity: 1, scale: 1.05, y: -2 },
        tap: { scale: 0.95 }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="min-h-screen bg-gradient-to-b from-gray-50 to-white"
        >
            {/* Hero Banner */}
            <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{
                        opacity: isImageLoaded ? 1 : 0,
                        scale: isImageLoaded ? 1 : 1.1,
                        transition: { duration: 1.2, ease: "easeOut" }
                    }}
                    className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-10"
                />

                <motion.img
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: "easeOut" }}
                    src={venueDetail.area_image}
                    alt={venueDetail.area_name}
                    onLoad={() => setIsImageLoaded(true)}
                    className="absolute inset-0 h-full w-full object-cover z-0 transition-transform duration-10000"
                />

                <div className="relative z-20 h-full w-full flex flex-col justify-between">
                    {/* Back Button */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="p-6"
                    >
                        <Link
                            to="/venues"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-300"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Areas</span>
                        </Link>
                    </motion.div>

                    {/* Venue Name */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.7 }}
                        className="p-10 md:p-16 text-center"
                    >
                        <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg mb-4">
                            {venueDetail.area_name}
                        </h1>
                    </motion.div>
                </div>
            </div>

            {/* Content Section */}
            <motion.div
                variants={containerVariants}
                className="container mx-auto py-12 px-4 sm:px-6 relative z-10 -mt-20"
            >
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                    {/* Left Column - Venue Details */}
                    <motion.div
                        variants={itemVariants}
                        className="lg:col-span-2 space-y-8"
                    >
                        {/* Main Card */}
                        <motion.div
                            variants={imageVariants}
                            className="bg-white rounded-xl overflow-hidden shadow-xl"
                        >
                            <div className="p-8">
                                <h2 className="text-3xl font-playfair font-bold text-gray-800 mb-6 flex items-center">
                                    <MapPin className="mr-3 text-indigo-600" />
                                    About This Area
                                </h2>

                                <p className="text-lg text-gray-700 leading-relaxed font-light mb-8">
                                    {venueDetail.description || "No description available."}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                                            <Users className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">Max Guests</h3>
                                            <p className="text-gray-600">{venueDetail.capacity} guests</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                                            <PhilippinePeso className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">Pricing</h3>
                                            <p className="text-gray-600">{formattedPrice}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Venue Navigation */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-white rounded-xl p-6 shadow-lg"
                        >
                            <div className="flex justify-between items-center">
                                {prevVenue ? (
                                    <Link to={`/venues/${prevVenue.id}`}>
                                        <motion.div
                                            initial="initial"
                                            whileHover="hover"
                                            whileTap="tap"
                                            variants={navButtonVariants}
                                            className="flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg"
                                        >
                                            <LeftArrow className="w-4 h-4" />
                                            <span>Previous Area</span>
                                        </motion.div>
                                    </Link>
                                ) : (
                                    <div className="w-[120px]"></div>
                                )}

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="flex flex-col items-center"
                                >
                                    <span className="text-gray-500 text-sm">Area</span>
                                    <span className="font-medium text-gray-800">
                                        {currentIndex + 1} of {allVenues.length}
                                    </span>
                                </motion.div>

                                {nextVenue ? (
                                    <Link to={`/venues/${nextVenue.id}`}>
                                        <motion.div
                                            initial="initial"
                                            whileHover="hover"
                                            whileTap="tap"
                                            variants={navButtonVariants}
                                            className="flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg"
                                        >
                                            <span>Next Area</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </motion.div>
                                    </Link>
                                ) : (
                                    <div className="w-[120px]"></div>
                                )}
                            </div>
                        </motion.div>

                        {/* Reviews Card */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-white rounded-xl p-8 shadow-lg"
                        >
                            <h2 className="text-2xl font-playfair font-bold text-gray-800 mb-6 flex items-center">
                                <Star className="mr-3 text-yellow-500" />
                                Guest Reviews
                            </h2>

                            <ReviewList
                                reviews={reviews}
                                isLoading={isLoadingReviews}
                                error={reviewsError as Error | null}
                            />
                        </motion.div>
                    </motion.div>

                    {/* Right Column - Reservation Card */}
                    <motion.div
                        variants={itemVariants}
                        className="lg:col-span-1 space-y-6"
                    >
                        {/* Image */}
                        <motion.div
                            variants={imageVariants}
                            className="bg-white p-4 rounded-xl shadow-lg overflow-hidden"
                        >
                            <img
                                src={venueDetail.area_image}
                                alt={venueDetail.area_name}
                                className="w-full h-64 object-cover rounded-lg transition-all duration-500 hover:scale-105"
                            />
                        </motion.div>

                        {/* Booking Card */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-white rounded-xl overflow-hidden shadow-lg sticky top-24"
                        >
                            <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
                                <h3 className="text-3xl font-bold">Book This Area!</h3>
                            </div>

                            <div className="p-6">
                                {/* Venue Information */}
                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                        <PhilippinePeso className="w-5 h-5 text-indigo-500 mr-3" />
                                        <div>
                                            <h4 className="font-medium text-gray-800">Pricing</h4>
                                            <p className="text-indigo-600 text-lg font-semibold">{formattedPrice}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                        <Users className="w-5 h-5 text-indigo-500 mr-3" />
                                        <div>
                                            <h4 className="font-medium text-gray-800">Max Guests</h4>
                                            <p className="text-gray-900 text-lg font-semibold">{venueDetail.capacity} guests</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Reserve Now Button */}
                                <Link to={`/venue-booking/${venueDetail.id}`} className="block">
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        className={`w-full py-4 px-6 ${isAuthenticated
                                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 cursor-pointer hover:from-indigo-700 hover:to-purple-700"
                                            : "bg-gray-400 cursor-not-allowed"
                                            } text-white font-bold text-lg rounded-lg transition-all duration-300 flex items-center justify-center`}
                                        disabled={!isAuthenticated}
                                    >
                                        {isAuthenticated ? (
                                            <>
                                                <BookOpen className="w-5 h-5 mr-2" />
                                                Book Now
                                            </>
                                        ) : (
                                            "Login to Book"
                                        )}
                                    </motion.button>
                                </Link>

                                {!isAuthenticated && (
                                    <p className="mt-3 text-center text-sm text-gray-500">
                                        Please login to make a reservation
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default VenueDetails;