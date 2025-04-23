import { Link } from "react-router-dom";

const Services = () => {
  return (
    <section className="w-full min-h-[80vh] py-8 bg-gray-50 flex items-center">
      <div className="w-[85vw] mx-auto">
        {/* Section Title */}
        <h2 className="font-playfair font-bold text-gray-900 mb-12 text-3xl md:text-5xl text-center">
          Our Premium Services
        </h2>

        {/* Services Grid - Adjusted for better space utilization */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 h-full">
          {/* Room Booking */}
          <div className="flex flex-col items-center text-center p-9 hover:bg-white hover:shadow-lg roundedxl transition-all duration-300 h-full">
            <div className="w-24 h-24 bg-purple-600 text-white flex justify-center items-center rounded-full mb-6">
              <i className="fas fa-bed text-4xl"></i>
            </div>
            <h3 className="font-playfair text-3xl font-semibold mb-6">
              Room Booking
            </h3>
            <p className="text-gray-700 font-medium font-montserrat leading-relaxed flex-grow">
              Discover our luxury suites and rooms featuring real-time
              availability, instant confirmation, premium amenities, and
              personalized check-in services for your perfect stay
            </p>
            <Link to={"/rooms"}>
              <button className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
                Explore Rooms
              </button>
            </Link>
          </div>

          {/* Venue Reservation */}
          <div className="flex flex-col items-center text-center p-9 hover:bg-white hover:shadow-lg rounded-xl transition-all duration-300 h-full">
            <div className="w-24 h-24 bg-purple-600 text-white flex justify-center items-center rounded-full mb-6">
              <i className="fas fa-map-marked-alt text-4xl"></i>
            </div>
            <h3 className="font-playfair text-3xl font-semibold mb-6">
              Area Reservation
            </h3>
            <p className="text-gray-700 font-medium font-montserrat leading-relaxed flex-grow">
              Celebrate memorable occasions in our exquisite venues, featuring
              tailored event planning, premium catering, and spaces for intimate
              to large gatherings.
            </p>
            <Link to={"/areas"}>
              <button className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
                View Areas
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
