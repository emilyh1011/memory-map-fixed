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

