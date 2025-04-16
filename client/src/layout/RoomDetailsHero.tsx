import deluxe_single from "../assets/deluxe_single.webp";
import { Link } from "react-router-dom";

const RoomDetailsHero = () => {
  return (
    <section
      className="h-[350px] w-full overflow-hidden bg-cover bg-center relative before:absolute before:inset-0 before:bg-black/60 before:z-0 text-white"
      style={{ backgroundImage: `url(${deluxe_single})` }}
    >
      <div className="absolute top-5 left-5 flex items-center gap-x-3 z-11 cursor-pointer">
        <Link
          to="/rooms"
          className="flex items-center gap-x-3 text-white hover:text-white/80"
        >
          <i className="fa fa-arrow-left text-xl"></i>
          <span className="text-xl">Back to Rooms</span>
        </Link>
      </div>

      <div className="relative z-10 px-6 lg:px-80">
        <div className="py-25 ">
          <h1 className="text-sm font-montserrat font-bold tracking-widest uppercase py-5">
            Azurea Luxury Experience{" "}
          </h1>
          <p className="text-6xl md:text-7xl font-playfair">Deluxe Room</p>
        </div>
      </div>
    </section>
  );
};

export default RoomDetailsHero;
