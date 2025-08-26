import {memo} from 'react';

const AddNamePopup = memo(function ({userInputName, setUserInputName, handleAddSpace}) {
    
    return(
        <div className="relative z-[500] flex w-full h-full justify-center items-center">

        <div className="flex flex-col justify-center items-center bg-sky-200 rounded-lg w-1/4 p-8 border-2 gap-4">
            <span className="text-[22px]">Location Missing Name</span>
            <span className="text-[16px]">Nominatim search didn't save a name for this location. Add a name:</span>
            <form className="w-full bg-white p-3 h-10 rounded-lg shadow-md shadow-gray-700 ">
                <input type="text"
                    value={userInputName}
                    onChange={(event) => {
                        setUserInputName(event.target.value);
                    }}
                    className="w-full h-full bg-white font-merriweatherr rounded-lg text-[15px] pl-2 focus:outline-none"
                />
            </form>
            <button
                onClick={(event) => {
                    if (userInputName.trim() !== "") {
                        event.preventDefault(); //prevent default action of page reloading after submit form
                        handleAddSpace();
                    }
                }}
                className="bg-blue-500 rounded-lg h-10 text-[15px] p-2 hover:border-[1px] border-sky-200 active:bg-blue-600">Submit
            </button>
        </div>
    </div>
    )
});

export default AddNamePopup;