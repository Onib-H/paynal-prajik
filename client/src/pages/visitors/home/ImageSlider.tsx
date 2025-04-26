import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode, Mousewheel } from "swiper/modules";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react"; // or use your own icons
import "../../../App.css";

import deluxe_single from "../../../assets/deluxe_single.webp";
import deluxe_double from "../../../assets/deluxe_double.jpg";
import deluxe_twin from "../../../assets/deluxe_twin.jpg";
import executive_king from "../../../assets/executive_king.webp";
import family_suite from "../../../assets/family_suite.jpg";
import president_suite from "../../../assets/president_suite.jpg";
import skyline_suite from "../../../assets/skyline_suite.jpg";
import rooftop_garden from "../../../assets/rooftop_garden.jpg";

const ImageSlider = () => {
  const swiperRef = useRef();

  const images = [
    { id: 1, src: deluxe_single, alt: "Deluxe Single Room" },
    { id: 2, src: deluxe_double, alt: "Deluxe Double Room" },
    { id: 3, src: deluxe_twin, alt: "Deluxe Twin Room" },
    { id: 4, src: executive_king, alt: "Executive King Room" },
    { id: 5, src: family_suite, alt: "Family Suite" },
    { id: 6, src: president_suite, alt: "President Suite" },
    { id: 7, src: skyline_suite, alt: "Skyline Suite" },
    { id: 8, src: rooftop_garden, alt: "Rooftop Garden" },
  ];

  return (
    <div className="relative w-full group">
      {/* Arrows */}
      <button
        onClick={() => swiperRef.current?.slidePrev()}
        className="absolute top-1/2 left-2 z-10 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
      >
        <ChevronLeft />
      </button>
      <button
        onClick={() => swiperRef.current?.slideNext()}
        className="absolute top-1/2 right-2 z-10 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
      >
        <ChevronRight />
      </button>

      {/* Swiper */}
      <Swiper
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        spaceBetween={0}
        freeMode={false}
        mousewheel={{ forceToAxis: true, invert: false }}
        autoplay={{ delay: 10000, disableOnInteraction: false }}
        loop={true}
        modules={[Autoplay, FreeMode, Mousewheel]}
        breakpoints={{
          1280: { slidesPerView: 5 },
          1024: { slidesPerView: 4 },
          768: { slidesPerView: 3 },
          0: { slidesPerView: 2 },
        }}
      >
        {images.map((image) => (
          <SwiperSlide key={image.id}>
            <img
              loading="lazy"
              src={image.src}
              alt={image.alt}
              className="w-full h-[300px] object-cover transition-transform hover:scale-105"
              draggable="false"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ImageSlider;
