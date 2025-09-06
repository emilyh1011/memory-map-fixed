import { memo } from 'react';

const AddSpacePopup = memo(function ({ activeSearchResult, setAskLocationName, setActiveSearchResult, handleAddSpace }) {
    return (
        <div className="relative z-[500] w-full h-full flex items-center">
            <div className="absolute right-1/8 z-[500] flex flex-col justify-center items-center gap-5 bg-white p-7 rounded-lg border-[2px] w-1/4">
                <span className="text-[15px]">Do you want to add a space at {activeSearchResult.name || activeSearchResult.display_name}?</span>
                <button
                    onClick={() => {
                        if (activeSearchResult.name === "") {
                            setAskLocationName(true); //Hide AddSpace popup and display AddName Popup
                        } else { //We can instantly save activeSearchResult to our spaces collection since the name field is valid
                            handleAddSpace();
                        }
                    }}
                    className="w-full text-[15px] p-2 rounded-lg bg-green-200 hover:border-[1px] border-sky-200 cursor-pointer active:bg-green-300">Yes</button>
                <button
                    onClick={() => {
                        setActiveSearchResult(null); //Reset activeSearchResult, restarts user flow.
                        //Don't reset results because user might've meant to click on a different location
                    }}
                    className="w-full text-[15px] p-2 rounded-lg bg-red-200 hover:border-[1px] border-sky-200 cursor-pointer active:bg-red-300">No</button>
            </div>
        </div>
    )
});

export default AddSpacePopup;