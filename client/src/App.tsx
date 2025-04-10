import AOS from "aos";
import "aos/dist/aos.css";
import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import GuestChangePassword from "./components/guests/GuestChangePassword";
import ScrollToTop from "./components/ScrollToTop";
import { useUserContext } from "./contexts/AuthContext";
import ProtectedRoute from "./contexts/ProtectedRoutes";
import AdminLayout from "./layout/admin/AdminLayout";
import Footer from "./layout/Footer";
import Navbar from "./layout/Navbar";

const LoadingHydrate = lazy(() => import("./motions/loaders/LoadingHydrate"));

const NotFound = lazy(() => import("./pages/_NotFound"));
const Homepage = lazy(() => import("./pages/Homepage"));
const AvailabilityResults = lazy(() => import("./pages/AvailabilityResults"));
const ConfirmBooking = lazy(() => import("./pages/ConfirmBooking"));
const ConfirmVenueBooking = lazy(() => import("./pages/ConfirmVenueBooking"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const RegistrationFlow = lazy(() => import("./pages/RegistrationFlow"));
const RoomDetails = lazy(() => import("./pages/RoomDetails"));
const Rooms = lazy(() => import("./pages/Rooms"));
const Venue = lazy(() => import("./pages/Venue"));
const BookingAccepted = lazy(() => import("./motions/BookingAccepted"));

const BookingCalendar = lazy(() => import("./pages/BookingCalendar"));
const VenueBookingCalendar = lazy(() => import("./pages/VenueBookingCalendar"));
const AboutUs = lazy(() => import("./pages/visitors/home/AboutUs"));
const CancelReservation = lazy(() => import("./pages/CancelReservation"));
const VenueDetails = lazy(() => import("./pages/VenueDetails"));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ManageAmenities = lazy(() => import("./pages/admin/ManageAmenities"));
const ManageAreas = lazy(() => import("./pages/admin/ManageAreas"));
const ManageBookings = lazy(() => import("./pages/admin/ManageBookings"));
const ManageRooms = lazy(() => import("./pages/admin/ManageRooms"));
const ManageUsers = lazy(() => import("./pages/admin/ManageUsers"));

const GuestProfile = lazy(() => import("./pages/guests/GuestProfile"));
const GuestDashboard = lazy(() => import("./pages/guests/GuestDashboard"));
const GuestBookings = lazy(() => import("./pages/guests/GuestBookings"));
const GuestCancellations = lazy(() => import("./pages/guests/GuestCancellations"));
const GuestLayout = lazy(() => import("./layout/guest/GuestLayout"));

const App = () => {
  const { isAuthenticated, role } = useUserContext();
  const location = useLocation();

  useEffect(() => {
    AOS.init({
      offset: 100,
      duration: 700,
      delay: 100,
    });
  }, [])

  const isAdminRoute =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/guest") ||
    location.pathname.startsWith("/registration") ||
    location.pathname.startsWith("/forgot-password") ||
    location.pathname.startsWith("/booking-accepted");

  return (
    <>
      <Suspense fallback={<LoadingHydrate />}>
        {!isAdminRoute && <Navbar />}
        <ScrollToTop />
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                role === "admin" ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Homepage />
                )
              ) : (
                <Homepage />
              )
            }
          />

          <Route path="/confirm-booking" element={<ConfirmBooking />} />
          <Route path="/confirm-venue-booking" element={<ConfirmVenueBooking />} />
          <Route path="/registration" element={<RegistrationFlow />} />
          <Route path="/booking-accepted" element={<BookingAccepted />} />

          <Route path="/venues" element={<Venue />} />
          <Route path="/venues/:id" element={<VenueDetails />} />
          <Route path="/venue-booking/:areaId" element={<VenueBookingCalendar />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:id" element={<RoomDetails />} />
          <Route path="/booking/:roomId" element={<BookingCalendar />} />
          <Route path="/availability" element={<AvailabilityResults />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/cancel-reservation" element={<CancelReservation />} />

          {/* Protected guest routes */}
          <Route element={<ProtectedRoute requiredRole="guest" />}>
            <Route path="/guest" element={<GuestLayout />}>
              <Route index element={<GuestDashboard />} />
              <Route path=":id" element={<GuestProfile />} />
              <Route path="bookings" element={<GuestBookings />} />
              <Route path="cancellations" element={<GuestCancellations />} />
              <Route path="change-password" element={<GuestChangePassword />} />
            </Route>
          </Route>

          {/* Protected admin routes */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="bookings" element={<ManageBookings />} />
              <Route path="areas" element={<ManageAreas />} />
              <Route path="rooms" element={<ManageRooms />} />
              <Route path="amenities" element={<ManageAmenities />} />
              <Route path="users" element={<ManageUsers />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        {!isAdminRoute && <Footer />}
      </Suspense>
    </>
  );
};

export default App;
