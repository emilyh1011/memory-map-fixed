Commit 4: Connecting the "MemoryMap" MongoDB database, loading all pre-saved "spaces" from "spaces" collection as map markers on mount, & continuing activeSearchResult logic(display a popup if activeSearchResult is not a space, ask user if they would like to add)

- Assumptions: Created an empty database

- Before continuing development on the frontend for activeSearchResult in the past commits, we need to connect our empty "MemoryMap" MongoDB database, so that in the future we can load all our pre-saved "spaces" from our "spaces" collection as map markers on mount. This will allow us to know if we need to conditionally render an "Add space" popup and preview Marker for our activeSearchResult.

1. .env file: Add a new line for our MongoDB database connection string(URI)
    - On the MongoDB website for our "MemoryMap" database, make sure to choose the connection string option for "Connecting with MongoDB for VS Code"

2. In our /server directory, create a new file db.mjs & connect our "spaces" MongoDB database.
- Load in our .env file, we need to get our file path to the .env file.
    - __filename: Get our file path to our current file db.mjs
    - __dirname: Get our directories path. This is all the directories that leads to our current file db.mjs, but removes our file name from the path.
    - dotenv.config(): Load in our .env file. 
        - path.resolve(__dirname, '../.env): Since our current directory is /memory-map-fixed/server but our .env file is up a directory in the root
        /memory-map-fixed, we need to resolve our __dirname path to get the correct file path to our .env file.
    - mongoose.connect(process.env.URI): Connect to our "MemoryMap" database with our database connection string.

- db.mjs starter code:

import mongoose from 'mongoose';
const {Schema} = mongoose;
import dotenv from 'dotenv'; 
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); //All the directories that leads to our current file, but removes file name from the path.
dotenv.config({path: path.resolve(__dirname, '../.env') }); 

mongoose.connect(process.env.URI);

# Mongoose Source: https://mongoosejs.com/docs/guides.html

3. db.mjs file: Define our SpaceSchema & Create a Space Model, so we can work with it.
    # 3a. Define our SpaceSchema
    - lastVisited will be the only different field where we write "default: null"
        - This is because lastVisited is based on the most recent memory.
        - When we first create a space, we will have no memories until a user adds memories. So lastVisited will first be null.
    
        const SpaceSchema = new mongoose.Schema({
            display_name: {type: String, required: true},
            name: {type: String, required: true},
            latitude: {type: Number, required: true},
            longitude: {type: Number, required: true},
            place_id: {type: Number, required: true},
            type:{type: String, required: true}, //ice_cream, park, restaurant
            lastVisited: {type: Date, default: null}, //when we create a new space, no memories, so no lastVisited date
        }, {timestamps: true});

    # 3b. Model our SpaceSchema
     - mongoose.model(modelName, schema)
        - modelName: The singular name of the collection in our database that our model is for. Mongoose automatically looks for the plural, lowercased version of your model name.
            - Ex: "Space" Model --> "spaces" collection.
            - * * The good thing about MongoDB is that you don't have to pre-create any collections. The first time you save a document to this Space model, MongoDB will pluralize & lowercase the modelName to automatically create a collection in your database.
            - * * In the future, when MongoDB saves documents to this Model, it will autmatocially save it to the collection it created for you.
        - schema: The schema that will be applied to our collection for modeling data. Defines the shapes and rules for documents in this collection.

        const Space = mongoose.model('Space', SpaceSchema);
    
    # 3c. Export our Space model, so we can work with it in other files.
    - We will import this model into our app.mjs file, so we can create GET and POST API endpoints to access/modify our "spaces" collection

        export{
            Space
        }

4. app.mjs file: Import our Space model and create our GET "/getAllSpaces" 
    - GET "/getAllSpaces": API endpoint to retrieve all documents from our "spaces" collection.

    import axios from 'axios';
    import {useEffect} from 'react';

    app.get("/getAllSpaces", async (req, res) => {
        const spaces = await Space.aggregate([
            {
                $project: {
                    display_name: 1,
                    name: 1,
                    latitude: 1,
                    longitude: 1,
                    place_id: 1,
                    type: 1,
                    lastVisited: {
                        $dateToString: {
                            format: "%B %d, %Y %H:%M",
                            date: "$createdAt"
                        },
                    },
                }
            }
        ]);
        console.log("in backend, all my spaces: ", spaces);
        res.json(spaces);
    })

5. Map.jsx file: At beginning of screen mount, call our "/getAllSpaces" GET api endpoint

    # 5a. Create a new spaces state & a fetchSpaces() function
    - Create a new state to keep track of spaces retrieved from the database: spaces
    - We aren't writing our "getAllSpaces" api call directly in a useEffect() hook.
        - We will still need to call this api endpoint whenever we add a new space to our map because we will need to update spaces state again to trigger a re-render of our Map.jsx component. Triggering a re-render will allow our Markers to re-render so the user can automatically see the new Marker on the map for their newly added space. 
        - As a result, let's wrap our "getAllSpaces" call in a reusable function: fetchSpaces()

        const [spaces, setSpaces] = useState([]);

        function fetchSpaces() {
            axios.get("http://localhost:3000/getAllSpaces").then((response) => {
                console.log("this is our spaces from frontend: ", response.data);
                setSpaces(response.data);
            }).catch((err) => {
                console.log(err);
            });
        }

    # 5b. Call fetchSpaces in useEffect() hook once on mount to retrieve all spaces from database
    - useEffect(function, []): Empty dependency array, so React will only call our effect once at initial render.
    - * * WE don't need to put our spaces state variable as a dependency of our effect because the effect will re-run everytime spaces change. But, when we call the effect, we also have setSpaces() which will cause spaces to change again. So, this will then call the effect again --> Infinite loop of calling effect BAD! --> React will also keep re-rendering from the state variable constantly changing, also BAD!

        useEffect(()=>{
        fetchSpaces();
        }, []);

6. Map.jsx file: Render our spaces as individual markers int the <TileLayer>

    {spaces.map((space)=>{
        <Marker position={[space.latitude, space.longitude]}></Marker>
    })}

 ---- Now that we have our initial spaces array setup, we are going back to activeSearchResult functionality -------

7. Map.jsx file: If our activeSearchResult is not already a created "space"(doesn't have a marker), dynamically render a faded "preview" marker with a popup asking the user if they want to create a Space here.
- We will keep track by using our checkLocationIsInSpaces() function and seeing if activeSearchResult exists(recall activeSearchResult clears on every search, so popup will also clear on every new search too)

    # 7a. Create a function to check if the activeSearchResult is already a space: checkLocationIsInSpaces()
    - We iterate through our spaces array to check if any of the spaces place_id matches with our activeSearchResult's place_id
    
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

    # 7b. Create a custom icon: previewIcon
    - When a user clicks on a search result and the search result isn't already part of our spaces[] array 
        --> Popup rendered asking user if they want to add this location as a space & a previewIcon marker on the map will be rendered

        import {Icon} from 'leaflet'

        const previewIcon = new Icon({
            iconUrl: pin,
            iconSize: [38,38],
            attribution: <a href="https://www.flaticon.com/free-icons/location" title="location icons">Location icons created by Vitaly Gorbachev - Flaticon</a>
        })
    
    # 7c. Conditionally render the "Add Space?" Popup and previewIcon marker
    - !checkLocationInSpaces(): User selected a search result(activeSearchResult) && the search result isn't already a space.
    - activeSearchResult: Handles clearing the popup when user makes a new search. Basically, on every new search, we remove the old popup that corresponds to the old activeSearchResult.

        {/** Conditionally render a clear marker that asks user if they want to add a space here*/}}
        
        {(activeSearchResult && !checkLocationInSpaces())?
            <div className = "relative z-[500] w-full h-full flex items-center">
                <Marker position={activeSearchResultPosition} icon = {previewIcon}></Marker>

                <div className = "absolute right-1/8 z-[500] flex flex-col justify-center items-center gap-5 bg-white p-7 rounded-lg border-[2px] w-1/4">
                    <span className = "text-[15px]">Do you want to add a space at {activeSearchResult.name || activeSearchResult.display_name}?</span>
                    <button className = "w-full text-[15px] p-2 rounded-lg bg-green-200 hover:border-[1px] border-sky-200 active:bg-green-300">Yes
                    </button>
                    <button className = "w-full text-[15px] p-2 rounded-lg bg-red-200 hover:border-[1px] border-sky-200 active:bg-red-300">No
                    </button>
                </div>
            </div> 
            : null
        }

8. Handling "No" choice to "Add Space?" Popup
- The "backtracking" option
- If user clicks "no" on adding activeSearchResult as a space --> Reset activeSearchResult to null --> Hide popup & search results will display again
- Don't reset search results because user may have meant to click on a different search result
     
     <button 
        onClick={()=>{ setActiveSearchResult(null); }}
        className = "w-full text-[15px] p-2 rounded-lg bg-red-200 hover:border-[1px] border-sky-200 active:bg-red-300">No
    </button>
       
    
9. Handling "Yes" choice to "Add Space?" Popup
- We need to create a new POST API endpoint in our app.mjs file where we save the necessary parameters from activeSearchResult to our "spaces" collection

    # 9a. Create a POST "/addSpace" in our /server/app.mjs file
    - Since this is a post request, we no longer use a {params: } object to pass a query object.
    - Now, for a POST request, we pass a POST body object instead of a GET query object.
    - req.body to access the object we passed from the frontend

        app.post("/addSpace", async(req, res) =>{
            console.log("in backend our req.body, ", req.body);

            const newSpace = new Space({
                display_name: req.body.display_name,
                name: req.body.name,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                place_id: req.body.place_id,
                type: req.body.type,
                lastVisited: req.body.lastVisited,
            });

            console.log("this is our newSpace", newSpace);

            try{
                await newSpace.save();
                res.json({success: "Check out your new space on the map!"})
            }catch(err){
                res.json({error: "Failed to add space. Try again later."});
            }
        })
    
    # 9b. Define two new states for handling displaying the success/error message.
    - addSpaceMessage: either an object with a "success" or "error" field
    - closeAddSpaceMessage: Keeps track if user wanted to close the success/error message

        const [addSpaceMessage, setAddSpaceMessage] = useState(null);
        const [closeAddSpaceMessage, setCloseAddSpaceMessage] = useState(false); 

    # 9c. Map.jsx: Define a handleAddSpace() function
    - When a user clicks "Yes" on the popup, we will call this function.
    - We will call our POST "/addSpace" endpoint in this function
    - We will also handle resetting the activeSearchResult user flow in this function
        - setActiveSearchResult(null): Stop displaying "Add space?" popup and preview marker.
        - setActiveSearchResultPosition(null)
        - setResults([]): Triggers re-render of our child search components that uses results state. Stops displaying search results.
        *  * Intuitively, we are no longer searching. Instead, we added a space, so reset activeSearchResult user flow. 
    
    - Also handle resetting our previous addSpace user flow
        -  setCloseAddSpaceMessage(false): Reset previous user's choice to close addSpace message. We don't reset closeAddSpaceMessage anywhere else, so we can initialize it to false on every new handleAddSpace() call.
        - setAddSpaceMessage(response.data): Set addSpaceMessage to current message recieved from the backend on our "addSpace" POST call.
        - fetchSpaces(): Trigger re-render of Markers on map by fetching our spaces collection again and updating our spaces state.

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
                setActiveSearchResult(null); 
                setActiveSearchResultPosition(null); 
                setResults([]);      
                setCloseAddSpaceMessage(false); 
                setAddSpaceMessage(response.data);
                fetchSpaces();  
            })
        }

    # 9d. Map.jsx: Call handleAddSpace() in our Yes button onClick()
        <button 
            onClick={()=>{ handleAddSpace();}}
            className = "w-full text-[15px] p-2 rounded-lg bg-green-200 hover:border-[1px] border-sky-200 active:bg-green-300">Yes
        </button>
    
    # 9e. Map.jsx: Render our success/error message: addSpaceMessage state
    - addSpaceMessage && !closeAddSpaceMessage: We will render our addSpaceMessage only when it exists(not null) and closeAddSpaceMessage isn't false.
    - Create the same outer container with the IoIosCloseCircle representing the close popup button
    - addSpaceMessage.success? : Conditionally render different inner div's with different stylings based on if the message was success or error.
        
        import { IoIosCloseCircle } from "react-icons/io";

        {addSpaceMessage && !closeAddSpaceMessage ? 
            <div className = "relative z-[500] w-full h-full flex items-center">
                
                <div className = "absolute right-1/8 z-[500] flex flex-col justify-center bg-sky-200 rounded-lg border-[2px] w-1/5 p-1">
                    <IoIosCloseCircle className = "text-[20px] text-red-400"
                        onClick={()=>{
                            setCloseAddSpaceMessage(true);
                        }}
                    />
                    
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

* * At the moment, when a user tries to add a space from the StructuredSearch.jsx component, our request fails. Our activeSearchResult returned from the StructuredSearch that calls "/addSpace" recieves an error from the backend. This is because when we search addresses by their street address, they tend to have an empty string saved for their "name" field from nominatim. Since our Schema requires the "name" field for our spaces collection, it requires a valid string that is not an empty string. 
* * In our next commit, we will handle new user logic for asking a user to add a name to these locations with empty string name fields.


Hooks Summary
-------------
- useEffect → “Run this effect whenever dependencies change.”

- useCallback → “Return the same cached function unless dependencies change. When dependencies change, return a new function reference.”

