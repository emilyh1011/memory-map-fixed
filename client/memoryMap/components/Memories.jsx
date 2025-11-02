import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules'
import 'swiper/css';
import "swiper/css/pagination";

import { RiPictureInPictureExitFill } from "react-icons/ri";

function Memories({ memories }) {

    const [showFullDescription, setShowFullDescription] = useState(false);
    const [selectedMemory, setSelectedMemory] = useState(null);

    return (
        <div className="flex w-full flex-col items-center gap-5 ">
            {memories.map((memory) => {
                return (
                    <div className="flex flex-col items-center w-full rounded-lg bg-slate-100 p-5 gap-5 relative
                                    hover:border-[1px] border-sky-200 cursor-pointer active:bg-slate-200"
                        onClick={() => {
                            setShowFullDescription(true);
                            setSelectedMemory(memory);
                        }}>
                        {/**Only render "zoom out" of memory/exit memory button if its the selected memory*/}
                        {selectedMemory == memory ?
                            <RiPictureInPictureExitFill className="text-[20px] text-sky-400 absolute top-4 left-4 
                                hover:cursor-pointer active:text-sky-500"
                                onClick={(event) => {
                                    event.stopPropagation(); //Don't let event of closing memory from bubbling up to outer Memory container
                                    setShowFullDescription(false)
                                    setSelectedMemory(null);
                                }}
                            />

                        : null}

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

                        {/**Preserve linebreaks that user entered from submitting to MongoDB database*/}
                        <span className={`whitespace-pre-wrap ${selectedMemory == memory && showFullDescription ? `` : `line-clamp-3`}`}>{memory.description}</span>


                        
                    </div>
                )
            })}
        </div>




    )
}

export default Memories;