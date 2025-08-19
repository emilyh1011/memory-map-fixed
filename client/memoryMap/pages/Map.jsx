import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { useState } from 'react';
import SimpleSearch from '../components/SimpleSearch';
import StructuredSearch from '../components/StructuredSearch'
import "../src/styles.css";
import 'leaflet/dist/leaflet.css';

function Map() {

    // const map = useMapEvents({
    //     click: ()=>{
    //         map.locate();
    //     }
    // })

    //By default, we display the simpleSearch
    const [isSimpleSearch, setIsSimpleSearch] = useState(true);

    return (
        <>

            <MapContainer center={[40.776676, -73.971321]} zoom={13} className="relative z-0">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />


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
                {isSimpleSearch? <SimpleSearch/> : <StructuredSearch/>}
                
            </div>
        </>
    )
}
export default Map;

//12:10: Markers list of objects where each object has the geocode and popupText.
//In return statement, he mapped each marker object to a <Marker> component imported from react-leaflet/
//{markers.map(marker => (
//  <Marker position {marker.geocode} icon={customIcon}></Marker>
//))}

//Create custom markers, put below markers[] declaration line(In my website, going to need to useEffect and get call to all existing spaces in my mongodb database).
//  import {Icon} from "leaflet"
// const customIcon = new Icon({iconUrl: '', iconSize: [38,38]})

//Collection of spaces
//Space: memories, lastVisited
// Memory: feeling, description, pictures
//Feeling options: joy, ache, accepted, love, alive, nostalgic/the feeling that u know u will miss this moment
