Commit 7: In this commit, we will focus on finishing the Memories UI, fixing the SpacePopup UI for StructuredSearch, and other bugs(need to clear search results when switching from search bars)

1. Create the Memories UI for a SpacePopup
- We will display the existing memories after the AddMemoryForm
- To display the images, we will incorporate swiperjs as our carousel library
- Source: https://swiperjs.com/react#swiper-props
- Source: https://www.youtube.com/watch?v=KL_yIf5uiJo

# 1a. Install Swiper library in frontend
    cd client/memoryMap
    npm i swiper
# 1b. Create a new file Memories.jsx in client/memoryMap/components
- This file will represent our Memories UI

import { Swiper, SwiperSlide} from 'swiper/react';
import {Pagination} from 'swiper/modules' //import the module
import 'swiper/css';
import "swiper/css/pagination"; //import the required styles

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

# 1c. Map.jsx: Separate SpacePopup rendering in Map.jsx from <MapContainer> and add rendering memories UI inside SpacePopup
- Previously, we placed SpacePopup inside of MapContainer, so the SpacePopup would naturally display above our Map with its Markers.
- However, with rendering memories, the SpacePopup is going to overflow vertically with a large enough memory or sufficent amount of memories.
- As a result, we should activate a vertical scrollbar for our SpacePopup container when it exceeds the container's max width.
- New SpacePopup div styles: <div className="absolute right-0 flex flex-col w-1/3 h-full max-h-screen items-center bg-white rounded-lg p-4 gap-4 overflow-y-auto z-[501]">
    - Wasn't working: overflow-y-auto paired with a max height(in our case max-h-screen) allows for a scrollbar when content in the container vertically overflows the max height.
    - Problem: We placed SpacePopup in MapContainer. Now, when the SpacePopup content overflows, the scrollbar isn't working. User can't see all the content. 
    - Why: MapContainer doesn't have a fixed or relative height. My scrollbar wasn't showing because React couldn't prove that the content inside of SpacePopup actually overflowed a max height because it wasn't even sure what the max height was. 

- Solution: Wrap our whole Map.jsx in a div with a defined "h-screen, w-screen, relative" styles, where MapContainer, SpacePopup, and Search Choices are children. With relative, we can still absolutely place our SpacePopup on the right side of our screen while now having a fixed/defined parent container height for our SpacePopup.
    -  Now, when we apply overflow-y-auto and max-h-full on SpacePopup, React can identify the max height is the screen and our content inside our SpacePopup was overflowing, so we correctly see the scrollbar. All we need to do now is adjust the SpacePopup z-index to be higher than the MapContainer z-index for the SpacePopup to still appear above MapContainer.

- Another reason to seperate SpacePopup from MapContainer is that SpacePopup doesn't render anything(Marker, tooltip, etc) that needs a MapContainer. SpacePopup doesn't depend on MapContainer

- Import Memories component, and [lace rendering memories UI below the AddMemory popup(showAddMemory conditional rendering)

import Memories from '../components/Memories'

<div className = "w-screen h-screen relative">
    <MapContainer ref={mapRef} center={[40.776676, -73.971321]} zoom={13} className="absolute top-0 left-0 w-full h-full z-0">
        ...
    </MapContainer>

    <div className = "z-[500]">
        {/**Only render the specific space if it exists and closeSpacePopup is false*/}
        {(selectedSpace && !closeSpacePopup) ?
            <div className="absolute right-0 flex flex-col w-1/3 h-full max-h-screen items-center bg-white rounded-lg p-4 gap-4 overflow-y-auto z-[501]">
                ...

                {memories != [] ?
                     <Memories memories={memories} /> : ""
                }
            </div>
        :null}
    </div>

    ...
    
</div>

2. SimpleSearch.jsx and StructuredSearch.jsx: Add a useEffect to reset search state variables on mount
- If a user was in the middle of an AddSpace popup or had search results in the other search bar, then this bug would persist into the switched search bar.
- When a user switches between SimpleSearch to StructuredSearch(or vise versa), we need to reset the activeSearchResult and searchResults state to clear any possible old states.

    //On choosing SimpleSearch, reset any possible previous activeSearchResult and searchResults from StructuredSearch
    useEffect(()=>{
        setActiveSearchResult()
        setResults([]);
    },[]);




        

            
            