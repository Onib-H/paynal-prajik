import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode, Mousewheel } from "swiper/modules";

import deluxe_single from "../../../assets/deluxe_single.webp";
import deluxe_double from "../../../assets/deluxe_double.jpg";
import deluxe_twin from "../../../assets/deluxe_twin.jpg";
import executive_king from "../../../assets/executive_king.webp";
import family_suite from "../../../assets/family_suite.jpg";
import president_suite from "../../../assets/president_suite.jpg";
import skyline_suite from "../../../assets/skyline_suite.jpg";
import rooftop_garden from "../../../assets/rooftop_garden.jpg";

const ImageSlider = () => {
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
    <div className="w-full overflow-hidden">
      <Swiper
        slidesPerView={5}
        spaceBetween={0}
        freeMode={true}
        mousewheel={{
          forceToAxis: true,
          invert: false,
        }}
        autoplay={{
          delay: 10000,
          disableOnInteraction: false,
          reverseDirection: false,
        }}
        loop={true}
        modules={[Autoplay, FreeMode, Mousewheel]}
        className="!overflow-visible"
      >
        {images.map((image) => (
          <SwiperSlide key={image.id} className="!w-fit">
            <div className="h-80 w-[calc(100vw/5)] overflow-hidden">
              <img
                loading="lazy"
                src={image.src}
                alt={image.alt}
                className="h-full w-full object-cover transition-transform hover:scale-105"
                draggable="false"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ImageSlider;
