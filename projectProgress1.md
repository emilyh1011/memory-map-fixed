Commit 2: Initialize Map, Initialize Nominatim Search Functionality

1. Initialize our map
    - MapContainer: center our map in Manhattan, NYC
    - TileLayer: the tiles that actually allow us to see our map(2 params, need to attribute it & put in link for actual tile url)

import {MapContainer, TileLayer} from 'react-leaflet'

import "../src/styles.css";
import 'leaflet/dist/leaflet.css'; //Necessary leaflet css import line to make sure map displays correctly

function Map(){
    return(
        <>
        <MapContainer center = {[40.7127, 74.0059]} zoom={13}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            
        </MapContainer>
        </>
    )
}
export default Map;

- After importing the necessary css line, in our styles.css stylesheet, add the given className: leaflet-container.
- In order for our map to display correctly, we need to also specify a size for our MapContainer. leaflet-container automatically applys to MapContainer without needing to specify the class name in the javascript code 

//Make if full screen
.leaflet-container{
    height: 100vh;
    width: 100vw;
}

2. Add the search functionality, for forward geocoding. We will be using Nominatim(HTTP API)
- Nominatim Sources: https://nominatim.org/release-docs/latest/api/Search/#examples, https://nominatim.openstreetmap.org/ui/search.html?street=30+w+32nd&city=new+york&state=NY&country=US&postalcode=10001
- For our Search Functionality, we will be creating a Simple Search(only uses q search param) and a Structured Search(uses multiple search params)
- When I initially only used the q search param, I was having trouble locating specific restaurants in my hometown and NYC. Adding in city details to my q search param didn't help either. The q search param was good for locating popular locations like Central Park, but it was too limited for capturing the scope of my project.

    # 2a. Map.jsx, create our search selection choices(checkboxes)
    - We will use the hook useState() to manage our search selection choice: isSimpleSearch

        import SimpleSearch from '../components/SimpleSearch';
        import StructuredSearch from '../components/StructuredSearch'
        //By default, we display the SimpleSearch
        const [isSimpleSearch, setIsSimpleSearch] = useState(true);

    - Selections for search is mutually exclusive, so we can use boolean to handle. 
    - For each checkbox click, we'll only need to handle case if the checkbox is not checked.
    - Because if the checkbox checked && clicked, we don't want to remove the selection.
        
        <div className="fixed flex flex-row top-10 left-14 z-500 gap-2">
            <div>
                <input type="checkbox" value="Simple Search" key="1" checked={isSimpleSearch}
                    onChange={() => {
                        if (!isSimpleSearch) {
                            setIsSimpleSearch(true);
                        }
                    }} />
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

    # 2b. Create a components directory, and in the components directory, create SimpleSearch.jsx
    - Look for react icons here: https://react-icons.github.io/react-icons/
    - Install react-icons: npm install react-icons
    - After choosing an icon, copy the import statement and use it as a component
    - useState() hook to manage the query state from our <input>, and results state
    - axios HTTP Client for node.js and the browser: we will use axios to make our GET and POST requests to our backend
    - https://axios-http.com/docs/example
        
        import { FaSearch } from "react-icons/fa";
        import axios from 'axios';
        const [simpleQuery, setSimpleQuery] = useState("");
        const [results, setResults] = useState([]); //In next projectProgress, we will move defining results as a state from the parent Map.jsx instead

    - Create our form UI & search results UI
        <form className="flex flex-row bg-white items-center w-md h-[60px] rounded-md shadow-md shadow-gray-700 pl-[8px]"
            onSubmit={handleSearch}>
            <FaSearch className="text-mediumblue" />
            <input
                type="text"
                name="searchbar"
                value={simpleQuery}
                placeholder="Search a location name"
                onChange={(event) => {
                    setSimpleQuery(event.target.value);
                }}
                className='w-full h-full font-merriweather text-[18px] pl-2 focus:outline-none'
            >
            </input>
        </form>

        <div className="flex flex-col justify-center w-md">
            {results.map((result) => {
                return <div className="bg-white w-full rounded-md p-[4px] pl-[8px]">{result.display_name}</div>
            })}
        </div>
    
    - Create our handleSearch function
    - Prevent default action of page reloading after form submission
    - axios.get(): has an optional second parameter for passing in a params object. In the backend, our params object will be accessed as the req.query
    - {params: objectName}: expects an object. We need to wrap our simpleQuery state variable into an object
    - When making an axios.get() or axios.post() request, the response is wrapped in a promise.
    - axios.get().then((response)=>{ }): Use .then() to resolve the promise.
    - Axios already parsed the JSON, so we don't need to parse the response into a javscript object
    - response.data: Access the data returned by server 
    - GET /search-bar: returns an array of search results from the nominatim API based on our simpleQuery
    
        async function handleSearch(e) {
            e.preventDefault(); //Prevent default action of page reloading after form submission

            //Only let search go through if user didn't submit just spaces or an empty string search,
            if (simpleQuery.trim() !== "") {
                axios.get("http://localhost:3000/search-bar", { params: { simpleQuery } }).then((response) => {
                    setResults(response.data);
                }).catch((err) => {
                    console.log(err);
                })
            }
        }


    # 2c. In our components directory, create a StructuredSearch.jsx
    - Similar to SimpleSearch, we just have multiple states to manage now with the multiple param variables: street, city, county, state, country, postalcode(provided by the nominatim structured query)

    # 2d. In app.mjs, write our first API endpoint: /search-bar
    - app.get("/search-bar): GET request for nominatim forward geosearching
    - In the frontend, we passed in a params object. To access the params object in the backend, use req.query.
    - To access our variable wrapped in the object, req.query.variableName
    - URLSearchParams{} object: To store our search parameter entries as key:value pairs.
    - if(req.query.simpleQuery): If we submitted {params : {simpleQuery}} where simpleQuery was not an empty string, our code will detect that simpleQuery exists and user meant to make a SimpleSearch.
    - else{}: If req.query.simpleQuery field is undefined, javascript will evaluate this as falsy and correctly evaluate that our user submitted from StructuredSearch with {params: {street, city, county, state, country, postalcode}}
    
    app.get("/search-bar", async (req, res) => {
        let url;
        const params = new URLSearchParams({format: 'jsonv2', limit: '8', addressdetails: '1'});

        if(req.query.simpleQuery){
            url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(req.query.simpleQuery)}`;
        }else{ //If this key DNE, then we passed params object from StructuredSearch
            console.log("in structured", req.query);
            
            //Iterate over our query object as an array of [key,value] pairs
            const queryAsKeyValuePairs = Object.entries(req.query);
            console.log(queryAsKeyValuePairs);
            for(const [key,value] of queryAsKeyValuePairs){
            
                //Only include the params that aren't empty string or just spaces
                if(value.trim() !== ""){
                    params.append(key, value);
                }
            }

            console.log(params.toString());
        
            url =`https://nominatim.openstreetmap.org/search?${params.toString()}`;
        }

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'SpacesMemoryMap/1.0 (you@example.com)',
                    'Accept': 'application/json',
                }
            });
            const dataParsed = await response.json();
            res.json(dataParsed);
        } catch (err) {
            res.json(err);
        }
    })

    
    

