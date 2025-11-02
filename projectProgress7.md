# Add some fixes to the Space Popup UI and add a selected memory UI
- At the moment, we have the problem where when a user submits a memory in the AddMemory Popup form, the line spacing for the memory's description is not rendered once posted. 
- Additionally, to prevent the user from scrolling what seems to be nonstop, clamp each of the memories at 3 lines and only display the full description for the selected memory.

1. Memories.jsx
    
    # 1a. Define a showFullDescription and selectedMemory state
    
    //When click on memory, show full description instead of clamped 3 lines
    //as long as its the selectedMemory
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [selectedMemory, setSelectedMemory] = useState(null);

    # 1b. Import an exit memory button
    - I wanted to use a "zoom out" button because I felt like after clicking into a memory, 
    you zoom into the selectedMemory by expanding to show the full memory description

        import { RiPictureInPictureExitFill } from "react-icons/ri";

    # 1c. For each memory, add conditional rendering for the exit memory button
    - Place the zoom out of memory button at the top left of the Memory container
    - Update the outermost Memory container styling and add the conditional rendering for the exit memory button
    as the first nested container

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
        
    # 1d. Update Memory Description conditional styling
    - whitespace-pre-wrap: Preserve linebreaks that user entered from submitting to MongoDB database
    - Only render full memory description if user clicked on this memory and it's the only selected memory
    - line-clamp-3: Otherwise, only render 3 of the lines

        <span className={`whitespace-pre-wrap ${selectedMemory == memory && showFullDescription ? `` : `line-clamp-3`}`}>
            {memory.description}
        </span>




