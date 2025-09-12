import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useRef, useState, useCallback, useEffect } from 'react';
import SimpleSearch from '../components/SimpleSearch';
import StructuredSearch from '../components/StructuredSearch'

import ResultAddSpaceMessage from '../components/ResultAddSpaceMessage';
import AddNamePopup from '../components/AddNamePopup';
import AddSpacePopup from '../components/AddSpacePopup';

import { IoIosCloseCircle } from "react-icons/io";
import { MdAddCircleOutline } from "react-icons/md";
import { IoIosRemoveCircleOutline } from "react-icons/io";

import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

import Memories from '../components/Memories'

import "../src/styles.css";
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import pin from '../src/assets/pin.png';
import { Icon } from 'leaflet'

function Map() {

    const mapRef = useRef(null);

    //By default, we display the simpleSearch
    const [isSimpleSearch, setIsSimpleSearch] = useState(true);

    //This will keep track of which search result the user selects. This will also be passed back up into the parent Map.jsx
    const [activeSearchResult, setActiveSearchResult] = useState(null);
    const [results, setResults] = useState([]); //Since we also need to use results state in parent, we'll pass this state down to children as well.

    //For react-leaflet, their methods accept points. Easiest way: [latitude, longitude]
    const [activeSearchResultPosition, setActiveSearchResultPosition] = useState([]);

    const [spaces, setSpaces] = useState([]);

    const [addSpaceMessage, setAddSpaceMessage] = useState(null); //either an object with a "success" or "error" field

    const [closeAddSpaceMessage, setCloseAddSpaceMessage] = useState(false); //keep track if user wanted to close success/error message
    const previewIcon = new Icon({
        iconUrl: pin,
        iconSize: [38, 38],
        attribution: <a href="https://www.flaticon.com/free-icons/location" title="location icons">Location icons created by Vitaly Gorbachev - Flaticon</a>
    });

    const [userInputName, setUserInputName] = useState(""); //If user needs to add a name for an empty string activeSearchResult.name
    const [askLocationName, setAskLocationName] = useState(false); //Keeps track of if we need to display/hide the UI for asking for a location name

    const [selectedSpace, setSelectedSpace] = useState(null); //Store our selected space, the space marker that was clicked on 
    const [closeSpacePopup, setCloseSpacePopup] = useState(false);

    const [memories, setMemories] = useState([]); //When a user selects a space, store all our memories in this array

    const [showAddMemory, setShowAddMemory] = useState(false);
    const [addMemoryTitle, setAddMemoryTitle] = useState("");
    const [addMemoryDescription, setAddMemoryDescription] = useState("");
    const [addMemoryActiveFeeling, setAddMemoryActiveFeeling] = useState("");
    const [addMemoryDate, setAddMemoryDate] = useState(null);
    const [addMemoryImages, setAddMemoryImages] = useState([]);

    const feelings = ["joy", "ache", "longing", "accepted", "nostalgic", "alive"] //Store our possible feelings options with their unique indexes

    //We will call fetchSpaces once on mount and also whenever we add a new space
    function fetchSpaces() {
        axios.get("http://localhost:3000/getAllSpaces").then((response) => {
            console.log("this is our spaces from frontend: ", response.data);
            setSpaces(response.data);
        }).catch((err) => {
            console.log(err);
        });
    }

    useEffect(() => {
        fetchSpaces();
    }, []);

    //When we want to update the activeSearchResult state from the child components, we will call this callback 
    //function that is defined here in our parent Map.jsx.
    const handleActiveSearchResult = useCallback((r) => {
        setActiveSearchResult(r);
        const positionLatitude = parseFloat(r.lat);
        const positionLongitude = parseFloat(r.lon);
        //console.log("our parsed position, ", positionLatitude, positionLongitude);
        setActiveSearchResultPosition([positionLatitude, positionLongitude]);
        mapRef.current.flyTo([positionLatitude, positionLongitude], 15);
    }, [])

    function checkLocationInSpaces() {
        let isInSpaces = false;
        let i = 0;
        while (i < spaces.length && !isInSpaces) {
            if (spaces[i].place_id == activeSearchResult.place_id) {
                isInSpaces = true
            }
            i++;
        }
        return isInSpaces;
    }

    const handleAddSpace = useCallback(() => {
        axios.post("http://localhost:3000/addSpace", {
            display_name: activeSearchResult.display_name,
            name: activeSearchResult.name || userInputName.trim(),
            latitude: activeSearchResultPosition[0],
            longitude: activeSearchResultPosition[1],
            place_id: activeSearchResult.place_id,
            type: activeSearchResult.type,
            lastVisited: null
        }).then((response) => {
            setActiveSearchResult(null);
            setActiveSearchResultPosition(null);
            setResults([]);

            setCloseAddSpaceMessage(false);

            setAskLocationName(false);
            setUserInputName("");

            setAddSpaceMessage(response.data);
            fetchSpaces();
        })
    }, [activeSearchResult, userInputName, activeSearchResultPosition, fetchSpaces]);

    function fetchMemories(spaceId) {
        axios.get("http://localhost:3000/getAllMemories", { params: { spaceId } }).then((response) => {
            setMemories(response.data);
        }).catch((err) => {
            console.log(err);
        })
    }

    function handleAddMemory(event) {
        event.preventDefault();

        const memoryFormData = new FormData();
        memoryFormData.append("title", addMemoryTitle);
        memoryFormData.append("feeling", addMemoryActiveFeeling);
        memoryFormData.append("memoryDate", addMemoryDate);
        memoryFormData.append("description", addMemoryDescription);
        memoryFormData.append("spaceId", selectedSpace._id);

        for (let i = 0; i < addMemoryImages.length; i++) {
            memoryFormData.append("images", addMemoryImages[i]);
        }

        // for (let [key, value] of memoryFormData.entries()) {
        //    console.log(`${key}:`, value);
        // }

        axios.post("http://localhost:3000/addMemory", memoryFormData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            }).then((response) => {
                setShowAddMemory(false);
                setAddMemoryTitle("");
                setAddMemoryActiveFeeling("");
                setAddMemoryDescription("");
                setAddMemoryImages([]);
                console.log("my returned add memory response: ", response.data);

                fetchMemories(selectedSpace._id);
                getUpdatedSpace(selectedSpace._id);

            }).catch((err) => {
                console.log(err);
            });
    }

    function getUpdatedSpace(spaceId) {
        axios.get("http://localhost:3000/getSpace", { params: { spaceId } }).then((response) => {

            const updatedSpace = response.data;

            //After we save a memory to the memories collection, the corresponding Space document's lastVisited field may change, so we need to 
            // update that space in our frontend spaces state.
            //Why: If a user closes the SpacePopup after adding a memory to the space and then reopens the same space, we will see the
            // lastVisited field reverted back to the old lastVisited(from b4 the memory was added).
            //This error occurs because our selectedSpace and therefore SpacePopup is rendered based on the spaces state and we didn't update our
            // updatedSpace in the frontend spaces state, so our SpacePopup is rendering the old spaces state with the old Space document.
            setSpaces((spaces) => {
                return spaces.map(space =>
                    space._id == updatedSpace._id ? updatedSpace : space
                )
            })

            setSelectedSpace(updatedSpace);

        }).catch((err) => {
            console.log(err);
        })
    }


    return (
        <div className="w-screen h-screen relative">

            <MapContainer ref={mapRef} center={[40.776676, -73.971321]} zoom={13} className="absolute top-0 left-0 w-full h-full z-0">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/**Existing spaces*/}
                {spaces.map((space) => {
                    return (
                        <Marker position={[space.latitude, space.longitude]} key={space.place_id}
                            eventHandlers={{
                                click: () => {
                                    mapRef.current.panTo([space.latitude, space.longitude], 15);
                                    setCloseSpacePopup(false);
                                    setSelectedSpace(space);
                                    fetchMemories(space._id);
                                },
                            }}>

                        </Marker>
                    )
                })}

                {/**User selected a search result && the search result isn't already a space.
                 * AddSpace Popup with a Preview Marker*/}
                {(activeSearchResult && !checkLocationInSpaces() && !askLocationName) ?
                    <>
                        <Marker position={activeSearchResultPosition} icon={previewIcon}></Marker>

                        <AddSpacePopup activeSearchResult={activeSearchResult} setAskLocationName={setAskLocationName} setActiveSearchResult={setActiveSearchResult} handleAddSpace={handleAddSpace} />
                    </>

                    : null
                }

                {/**AddName Popup */}
                {askLocationName ?
                    <AddNamePopup userInputName={userInputName} setUserInputName={setUserInputName} handleAddSpace={handleAddSpace} /> : null
                }

                {/**The error/success message after use tries to add a space.*/}
                {addSpaceMessage && !closeAddSpaceMessage ?
                    <ResultAddSpaceMessage addSpaceMessage={addSpaceMessage} setCloseAddSpaceMessage={setCloseAddSpaceMessage} /> : null
                }

            </MapContainer>

            <div className="z-[500]">
                {/**Only render the specific space if it exists and closeSpacePopup is false*/}
                {(selectedSpace && !closeSpacePopup) ?

                    <div className="absolute right-0 flex flex-col w-1/3 h-full max-h-screen items-center bg-white rounded-lg p-4 gap-4 overflow-y-auto z-[501]">

                        {/**Put our x button on top left corner of our popup*/}
                        <IoIosCloseCircle className="absolute top-1 left-1 text-[20px] text-red-400 hover:cursor-pointer"
                            onClick={() => {
                                setCloseSpacePopup(true);  //Close popup
                                setSelectedSpace(null); //On close, reset selectedSpace too

                                setMemories([]);        //Recent stored memories from that space too, and reset the add memory form, in case if user was in progress of making a memory but didn't submit
                                setShowAddMemory(false);
                                setAddMemoryTitle("");
                                setAddMemoryDescription("");
                                setAddMemoryActiveFeeling("");
                                setAddMemoryImages([]);
                            }}
                        />

                        {/**Header */}
                        <div className="flex flex-col items-center w-full gap-4">
                            <div className="flex flex-col items-center w-full gap-2">
                                <h1 className="text-[30px] font-semibold text-sky-400 text-center">{selectedSpace.name}</h1>
                                <span className="text-[12px]">{selectedSpace.display_name}</span>
                            </div>


                            <div className="flex justify-between items-center w-3/4">
                                <span className="text-[15px]">Last Visited: {selectedSpace.lastVisited ? selectedSpace.lastVisited : `N/A, add a memory!`}</span>
                                <MdAddCircleOutline className={`text-[20px] text-sky-400 font-semibold hover:cursor-pointer ${showAddMemory ? 'hidden' : ''}`}
                                    onClick={() => { setShowAddMemory(true) }} />
                                <IoIosRemoveCircleOutline className={`text-[20px] text-sky-400 font-semibold hover:cursor-pointer ${showAddMemory ? '' : 'hidden'}`}
                                    onClick={() => {
                                        setShowAddMemory(false) //clear memory form and fields
                                        setAddMemoryTitle("");
                                        setAddMemoryDescription("");
                                        setAddMemoryActiveFeeling("");
                                        setAddMemoryImages([]);
                                    }} />
                            </div>

                            {showAddMemory ?
                                <div className="w-full">
                                    <form className="flex flex-col bg-slate-100 rounded-lg w-full items-center p-4 gap-5" onSubmit={handleAddMemory}>
                                        <input type="text"
                                            value={addMemoryTitle}
                                            placeholder="Add a memory title"
                                            onChange={(event) => { setAddMemoryTitle(event.target.value) }}
                                            className="text-[18px] text-center text-gray-800 focus:outline-none w-full p-2 border-b-2 border-sky-400"></input>

                                        <div className="flex gap-2 justify-center items-center">
                                            {feelings.map((feeling, i) => {
                                                return (<div key={i} className={`border-1 border-sky-400 p-2 text-[12px] rounded-xl ${addMemoryActiveFeeling === feeling ? "bg-sky-400" : ""} hover:cursor-pointer`}
                                                    onClick={() => { setAddMemoryActiveFeeling(feeling) }}>{feeling}</div>)
                                            })}
                                        </div>

                                        <DatePicker label="Memory Date"
                                            onChange={(date) => { setAddMemoryDate(date); console.log("prev date: ", addMemoryDate) }} />

                                        <textarea type="text"
                                            value={addMemoryDescription}
                                            placeholder="Add a memory description"
                                            onChange={(event) => { setAddMemoryDescription(event.target.value) }}
                                            className="h-50 text-[12px] text-gray-800 w-full focus:outline-none w-full border-2 border-sky-400 rounded-lg p-2">
                                        </textarea>
                                        <input type="file"
                                            name="image"
                                            multiple={true}
                                            onChange={(event) => { setAddMemoryImages(event.target.files) }} className="bg-sky-400 p-2 rounded-lg"></input>
                                        <button className="bg-blue-500 rounded-lg p-2 text-[14px] hover:border-[1px] border-sky-200 cursor-pointer active:bg-blue-600">Add Memory</button>
                                    </form>

                                </div>
                                : null}

                            {memories != [] ?
                                <Memories memories={memories} /> : ""
                            }

                        </div>

                    </div>

                    : null}
            </div>

            {/**Selections for search is mutually exclusive. For each checkbox click, only need to handle case if not checked.
             * Because if the checkbox checked && clicked, we don't want to remove the selection.
             */}
            <div className="fixed flex flex-row top-10 left-14 z-500 gap-2">
                <div>
                    <input type="checkbox" value="Simple Search" key="1" checked={isSimpleSearch}
                        onChange={() => {
                            if (!isSimpleSearch) {
                                setIsSimpleSearch(true);
                            }
                        }}

                    />
                    <label className="text-[14px] font-semibold">Simple Search</label>
                </div>
                <div>
                    <input type="checkbox" value="Structured Search" key="2" checked={!isSimpleSearch}
                        onChange={() => {
                            if (isSimpleSearch) {
                                setIsSimpleSearch(false);
                            }

                        }} />
                    <label className="text-[14px] font-semibold">Structured Search</label>
                </div>
            </div>

            <div className="fixed top-20 left-5 z-[500]">
                {isSimpleSearch ?
                    <SimpleSearch activeSearchResult={activeSearchResult}
                        handleActiveSearchResult={handleActiveSearchResult}
                        setActiveSearchResult={setActiveSearchResult}
                        results={results}
                        setResults={setResults} />
                    : <StructuredSearch activeSearchResult={activeSearchResult}
                        handleActiveSearchResult={handleActiveSearchResult}
                        setActiveSearchResult={setActiveSearchResult}
                        results={results}
                        setResults={setResults} />}
            </div>


        </div>
    )
}
export default Map;

//Collection of spaces
//Space: memories, lastVisited
// Memory: title, feeling, description, pictures