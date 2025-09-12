import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules'
import 'swiper/css';
import "swiper/css/pagination";

function Memories({ memories }) {
    
    return (
        <div className="flex w-full flex-col items-center gap-5">
            {memories.map((memory) => {
                return (
                    <div className="flex flex-col items-center w-full rounded-lg bg-slate-100 p-4 gap-5">
                        <span className="text-[18px] font-semibold">{memory.title}</span>
                        <div className="flex flex-row w-full justify-center items-center gap-4">
                            <span className="text-[15px] text-gray-800">{memory.memoryDate}</span>
                            <span className="text-[12px] text-gray-800 border-1 border-sky-400 rounded-xl p-2">{memory.feeling}</span>
                        </div>


                        <Swiper
                            modules={[Pagination]}
                            slidesPerView={1}
                            pagination={{ clickable: true }}
                            className="w-full h-80"
                        >
                            {memory.images.map((image) => {
                                return (
                                    //mx-auto centers our images inside the slide, both the vertical & horizontal images
                                    <SwiperSlide className="flex justify-center items-center">
                                        <img src={image}
                                            className="max-w-full max-h-full object-contain mx-auto rounded-lg" />
                                    </SwiperSlide>
                                )

                            })}

                        </Swiper>

                        <span>{memory.description}</span>



                    </div>
                )
            })}
        </div>




    )
}

export default Memories;