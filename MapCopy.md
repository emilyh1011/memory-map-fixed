- - Old Map.jsx without compartementalized popups

import { MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
import { useRef, useState, useCallback, useEffect} from 'react';
import SimpleSearch from '../components/SimpleSearch';
import StructuredSearch from '../components/StructuredSearch'
import ResultAddSpaceMessage from '../components/ResultAddSpaceMessage';
import "../src/styles.css";
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import pin from '../src/assets/pin.png';
import {Icon} from 'leaflet'

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
        iconSize: [38,38],
        attribution: <a href="https://www.flaticon.com/free-icons/location" title="location icons">Location icons created by Vitaly Gorbachev - Flaticon</a>
    });

    const [userInputName, setUserInputName] = useState(""); //If user needs to add a name for an empty string activeSearchResult.name
    const [askLocationName, setAskLocationName] = useState(false); //Keeps track of if we need to display/hide the UI for asking for a location name
    

    //We will call fetchSpaces once on mount and also whenever we add a new space
    function fetchSpaces() {
        axios.get("http://localhost:3000/getAllSpaces").then((response) => {
            console.log("this is our spaces from frontend: ", response.data);
            setSpaces(response.data);
        }).catch((err) => {
            console.log(err);
        });
    }

    useEffect(()=>{
       fetchSpaces();
    }, []);

    //When we want to update the activeSearchResult state from the child components, we will call this callback 
    //function that is defined here in our parent Map.jsx.
    const handleActiveSearchResult = useCallback((r)=>{
        setActiveSearchResult(r);
        const positionLatitude = parseFloat(r.lat);
        const positionLongitude = parseFloat(r.lon);
        //console.log("our parsed position, ", positionLatitude, positionLongitude);
        setActiveSearchResultPosition([positionLatitude, positionLongitude]);
        mapRef.current.flyTo([positionLatitude, positionLongitude], 15);
    }, [])

    function checkLocationInSpaces(){
        let isInSpaces = false; 
        let i = 0;
        while (i<spaces.length && !isInSpaces){
            if (spaces[i].place_id == activeSearchResult.place_id){
                isInSpaces = true
            }
            i++;
        }
       return isInSpaces; 
    }

    function handleAddSpace() {
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
    }


    return (
        <>

            <MapContainer ref = {mapRef} center={[40.776676, -73.971321]} zoom={13} className="relative z-0">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/**Existing spaces*/}
                {spaces.map((space)=>{
                    return <Marker position={[space.latitude, space.longitude]} key = {space.place_id}></Marker>
                })}

                {/**User selected a search result && the search result isn't already a space.
                 * AddSpace Popup with a Preview Marker*/}
                {(activeSearchResult && !checkLocationInSpaces() && !askLocationName)?

                    <div className = "relative z-[500] w-full h-full flex items-center">
                        
                        <Marker position={activeSearchResultPosition} icon = {previewIcon}></Marker>
                           
                         <div className = "absolute right-1/8 z-[500] flex flex-col justify-center items-center gap-5 bg-white p-7 rounded-lg border-[2px] w-1/4">
                            <span className = "text-[15px]">Do you want to add a space at {activeSearchResult.name || activeSearchResult.display_name}?</span>
                            <button 
                                onClick={()=>{
                                    if(activeSearchResult.name === ""){
                                        setAskLocationName(true); //Hide AddSpace popup and display AddName Popup
                                    }else{ //We can instantly save activeSearchResult to our spaces collection since the name field is valid
                                        handleAddSpace();
                                    }
                                }}
                                className = "w-full text-[15px] p-2 rounded-lg bg-green-200 hover:border-[1px] border-sky-200 active:bg-green-300">Yes</button>
                            <button 
                                onClick={()=>{
                                    setActiveSearchResult(null); //Reset activeSearchResult, restarts user flow.
                                                                //Don't reset results because user might've meant to click on a different location
                                }}
                                className = "w-full text-[15px] p-2 rounded-lg bg-red-200 hover:border-[1px] border-sky-200 active:bg-red-300">No</button>
                         </div>
                    </div> 
                    : null
                }

                {/**AddName Popup */}
                {askLocationName? 
                    <div className = "relative z-[500] flex w-full h-full justify-center items-center">
                        
                        <div className ="flex flex-col justify-center items-center bg-sky-200 rounded-lg w-1/4 p-8 border-2 gap-4">
                            <span className ="text-[22px]">Location Missing Name</span>
                            <span className = "text-[16px]">Nominatim search didn't save a name for this location. Add a name:</span>
                            <form className ="w-full bg-white p-3 h-10 rounded-lg shadow-md shadow-gray-700 ">
                                <input type = "text" 
                                value={userInputName} 
                                onChange={(event)=>{
                                    setUserInputName(event.target.value);
                                }}
                                className="w-full h-full bg-white font-merriweatherr rounded-lg text-[15px] pl-2 focus:outline-none"
                                />
                            </form>
                            <button 
                                onClick={(event)=>{
                                    if(userInputName.trim() !== ""){
                                        event.preventDefault(); //prevent default action of page reloading after submit form
                                        handleAddSpace();
                                    }
                                }} 
                                className = "bg-blue-500 rounded-lg h-10 text-[15px] p-2 hover:border-[1px] border-sky-200 active:bg-blue-600">Submit
                            </button>
                        </div>
                    </div>:
                    null
                }

                {/**The error/success message after use tries to add a space*/}
                {addSpaceMessage && !closeAddSpaceMessage?
                    <ResultAddSpaceMessage addSpaceMessage= {addSpaceMessage} setCloseAddSpaceMessage={setCloseAddSpaceMessage}/> : null
                }
                         

            </MapContainer>

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

            <div className="fixed top-20 left-5 z-500">
                {isSimpleSearch? 
                    <SimpleSearch activeSearchResult = {activeSearchResult} 
                        handleActiveSearchResult = {handleActiveSearchResult} 
                        setActiveSearchResult={setActiveSearchResult}
                        results = {results}
                        setResults ={setResults}/> 
                    : <StructuredSearch activeSearchResult={activeSearchResult} 
                        handleActiveSearchResult={handleActiveSearchResult} 
                        setActiveSearchResult={setActiveSearchResult}
                        results = {results}
                        setResults ={setResults}/>} 
            </div>

            
        </>
    )
}
export default Map;

//Collection of spaces
//Space: memories, lastVisited
// Memory: feeling, description, pictures
//Feeling options: joy, ache, accepted, love, alive, nostalgic/the feeling that u know u will miss this moment



- - New compartementalized Map.jsx 

import { MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
import { useRef, useState, useCallback, useEffect} from 'react';
import SimpleSearch from '../components/SimpleSearch';
import StructuredSearch from '../components/StructuredSearch'

import ResultAddSpaceMessage from '../components/ResultAddSpaceMessage';
import AddNamePopup from '../components/AddNamePopup';
import AddSpacePopup from '../components/AddSpacePopup';

import "../src/styles.css";
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import pin from '../src/assets/pin.png';
import {Icon} from 'leaflet'

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
        iconSize: [38,38],
        attribution: <a href="https://www.flaticon.com/free-icons/location" title="location icons">Location icons created by Vitaly Gorbachev - Flaticon</a>
    });

    const [userInputName, setUserInputName] = useState(""); //If user needs to add a name for an empty string activeSearchResult.name
    const [askLocationName, setAskLocationName] = useState(false); //Keeps track of if we need to display/hide the UI for asking for a location name
    

    //We will call fetchSpaces once on mount and also whenever we add a new space
    function fetchSpaces() {
        axios.get("http://localhost:3000/getAllSpaces").then((response) => {
            console.log("this is our spaces from frontend: ", response.data);
            setSpaces(response.data);
        }).catch((err) => {
            console.log(err);
        });
    }

    useEffect(()=>{
       fetchSpaces();
    }, []);

    //When we want to update the activeSearchResult state from the child components, we will call this callback 
    //function that is defined here in our parent Map.jsx.
    const handleActiveSearchResult = useCallback((r)=>{
        setActiveSearchResult(r);
        const positionLatitude = parseFloat(r.lat);
        const positionLongitude = parseFloat(r.lon);
        //console.log("our parsed position, ", positionLatitude, positionLongitude);
        setActiveSearchResultPosition([positionLatitude, positionLongitude]);
        mapRef.current.flyTo([positionLatitude, positionLongitude], 15);
    }, [])

    function checkLocationInSpaces(){
        let isInSpaces = false; 
        let i = 0;
        while (i<spaces.length && !isInSpaces){
            if (spaces[i].place_id == activeSearchResult.place_id){
                isInSpaces = true
            }
            i++;
        }
       return isInSpaces; 
    }

    const handleAddSpace = useCallback(()=>{
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


    return (
        <>

            <MapContainer ref = {mapRef} center={[40.776676, -73.971321]} zoom={13} className="relative z-0">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/**Existing spaces*/}
                {spaces.map((space)=>{
                    return <Marker position={[space.latitude, space.longitude]} key = {space.place_id}></Marker>
                })}

                {/**User selected a search result && the search result isn't already a space.
                 * AddSpace Popup with a Preview Marker*/}
                {(activeSearchResult && !checkLocationInSpaces() && !askLocationName)?
                        <>
                            <Marker position={activeSearchResultPosition} icon = {previewIcon}></Marker>
                           
                            <AddSpacePopup activeSearchResult = {activeSearchResult} setAskLocationName={setAskLocationName} setActiveSearchResult={setActiveSearchResult} handleAddSpace={handleAddSpace}/>
                    
                        </>
                        
                    : null
                }

                {/**AddName Popup */}
                {askLocationName? 
                    <AddNamePopup userInputName = {userInputName} setUserInputName={setUserInputName} handleAddSpace={handleAddSpace}/>: null
                }

                {/**The error/success message after use tries to add a space.*/}
                {addSpaceMessage && !closeAddSpaceMessage ? 
                    <ResultAddSpaceMessage addSpaceMessage= {addSpaceMessage} setCloseAddSpaceMessage={setCloseAddSpaceMessage}/> : null
                }    

            </MapContainer>

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
                {isSimpleSearch? 
                    <SimpleSearch activeSearchResult = {activeSearchResult} 
                        handleActiveSearchResult = {handleActiveSearchResult} 
                        setActiveSearchResult={setActiveSearchResult}
                        results = {results}
                        setResults ={setResults}/> 
                    : <StructuredSearch activeSearchResult={activeSearchResult} 
                        handleActiveSearchResult={handleActiveSearchResult} 
                        setActiveSearchResult={setActiveSearchResult}
                        results = {results}
                        setResults ={setResults}/>} 
            </div>

            
        </>
    )
}
export default Map;

//Collection of spaces
//Space: memories, lastVisited
// Memory: feeling, description, pictures
//Feeling options: joy, ache, accepted, love, alive, nostalgic/the feeling that u know u will miss this moment

