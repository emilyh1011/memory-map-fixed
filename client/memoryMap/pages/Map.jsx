import { MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
import { useRef, useState, useCallback, useEffect} from 'react';
import SimpleSearch from '../components/SimpleSearch';
import StructuredSearch from '../components/StructuredSearch'
import "../src/styles.css";
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import pin from '../src/assets/pin.png';
import {Icon} from 'leaflet'
import { IoIosCloseCircle } from "react-icons/io";

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

    function handleAddSpace(){
        
        axios.post("http://localhost:3000/addSpace", {
            display_name: activeSearchResult.display_name,
            name: activeSearchResult.name,
            latitude: activeSearchResultPosition[0],
            longitude: activeSearchResultPosition[1],
            place_id: activeSearchResult.place_id,
            type: activeSearchResult.type,
            lastVisited: null
         }).then((response)=>{
            setActiveSearchResult(null);//Stop displaying popup and preview marker
            setActiveSearchResultPosition(null); 
            setResults([]);            //Stop displaying search results. Intuitively, no longer searching, added a space, so reset activeSearchResult user flow.
            setCloseAddSpaceMessage(false); //Reset previous user's choice to close addSpace message
            setAddSpaceMessage(response.data);
            fetchSpaces();  //Re-render the markers by fetching our spaces collection
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
                 * Conditionally render a clear marker that asks user if they want to add a space here*/}
                {(activeSearchResult && !checkLocationInSpaces())?

                    <div className = "relative z-[500] w-full h-full flex items-center">
                        
                        <Marker position={activeSearchResultPosition} icon = {previewIcon}></Marker>
                           
                         <div className = "absolute right-1/8 z-[500] flex flex-col justify-center items-center gap-5 bg-white p-7 rounded-lg border-[2px] w-1/4">
                            <span className = "text-[15px]">Do you want to add a space at {activeSearchResult.name || activeSearchResult.display_name}?</span>
                            <button 
                                onClick={()=>{
                                    handleAddSpace();
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

                {addSpaceMessage && !closeAddSpaceMessage ? 
                    <div className = "relative z-[500] w-full h-full flex items-center">
                        <div className = "absolute right-1/8 z-[500] flex flex-col justify-center bg-sky-200 rounded-lg border-[2px] w-1/5 p-2">
                            <IoIosCloseCircle className = "text-[20px] text-red-400"
                                onClick={()=>{
                                    setCloseAddSpaceMessage(true);
                                }}/>
                        {addSpaceMessage.success?
                            <div className ="flex flex-col items-center p-4 gap-4 w-full bg-white rounded-lg border-[2px]">
                                <h1 className = "text-[22px] text-sky-400 ">Success</h1>
                                <span className = "text-[15px]">{addSpaceMessage.success}</span>
                            </div>: 
                            
                            <div className = "flex flex-col items-center p-4 gap-4 w-full bg-white rounded-lg border-[2px] border-[2px]">
                                <h1 className = "text-[22px] text-red-400">Error</h1>
                                <span className = "text-[15px]">{addSpaceMessage.error}</span>
                            </div>
                            
                        }
                        </div>
                    </div>
                : null}            

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
