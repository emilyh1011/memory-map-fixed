Commit 6: Clicking on a Space Marker and rendering a Space sidebar to add memories.
- Goals: Create a Space Sidebar. In the Space sidebar, render our Space detail.
- In the Space sidebar, create an AddMemory form to allow the user to add more memories. In the AddMemory form, incorporate a datepicker library and an image upload library. 
- In our backend, create a new Schema for a Memory, and create endpoints for handling add a memory logic.

1. server/db.mjs: Create a Memory Schema & export it.
- Recall: For each space, a user can add its associated memories.
- The images field will be optional
- spaceId: Stores and references the _id field of its corresponding Space document. Establishes a relationship between this Memory document and its corresponding Space document.

    const MemorySchema = new mongoose.Schema({
        title: {type: String, required: true},
        feeling: {type: String, required: true},
        memoryDate: {type: Date, required: true},
        description: {type: String, required: true},
        images: {type: Array},
        spaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Space", required: true }
    });

    const Memory = new mongoose.model("Memory", MemorySchema);

    export{
        Space, Memory
    }

2. Map.jsx: Create our SpacePopup
- # 2a. Define space popup states
    - selectedSpace: Stores our selected space, the space marker that was clicked on.
    - closeSpacePopup: Controls the rendering of our Space Popup. Initialized to false and every time a user clicks on a marker, we will reset the closeSpacePopup state to false.
    - memories: When a user selects a space, this will store all our memories for that space in this array.

        const [selectedSpace, setSelectedSpace] = useState(null);
        const [closeSpacePopup, setCloseSpacePopup] = useState(false);

        const [memories, setMemories] = useState([]);

- # 2b. server/app.mjs: Write our GET "/getAllMemories" api endpoint
- Returns all memories for a specific space. All Memory documents that reference the same spaceId field of a Space document.
- In our frontend, we will pass a spaceId field in our params object --> In our backend, We will access this field with req.query.spaceId.

- * * Notice: For all our GET requests, we want to return the date in a readable DateToString format --> aggregagation pipeline
- * * For all our POST requests, we want to save the dates as date objects to follow our enforced schema

- {$match: {spaceId: new mongoose.Types.ObjectId(`${req.query.spaceId}`)}} stage: Filter the memories collection to only return Memory documents whose spaceId field matches the value passed from frontend.
    - In our MemorySchema, we enforced our spaceId field to be of the ObjectId type, so let's ensure our frontend spaceId is of the same type, so we are comparing 2 items of the same type.
    - new mongoose.Types.ObjectId(Number) is deprecated, but new mongoose.Types.ObjectId(String) is not deprecated: Let's convert our frontend spaceId into a string first before converting it into the ObjectId type for comparison.
-{$project: {}} stage: We can specify fields we want to pass back into our frontend with the number 1. We can also modify any fields in this stage. Modify our date object memoryDate into a readable dateToString format.

    import {Space, Memory} from './db.mjs';
    
    app.get("/getAllMemories", async(req, res)=>{

        const memories = await Memory.aggregate([
            {
                $match: {spaceId: new mongoose.Types.ObjectId(`${req.query.spaceId}`)}
            },
            {
                $project: {
                    title: 1,
                    feeling: 1,
                    memoryDate: {
                        $dateToString: {
                            format: "%B %d, %Y",
                            date: "$memoryDate"
                        },
                    },
                    description: 1,
                    images: 1,
                    spaceId: 1,
                }
            }]
        );
        console.log("in backend, all my memories: ", memories);
        res.json(memories);
    })

- # 2c. client/Map.jsx: Write our fetchMemories() function
- Calls our GET "/getAllMemories" endpoint

    function fetchMemories(spaceId){
        axios.get("http://localhost:3000/getAllMemories", {params: {spaceId}}).then((response)=>{
            setMemories(response.data);
        }).catch((err)=>{
            console.log(err);
        })
    }

- # 2d. Update our rendering Marker logic.
- eventHandlers prop: This allows us to add some javascript logic on certain events done on our Space Marker.
    - click: Start our SpacePopup user flow.
        - Pan the screen to our selected space.
        - Render our Space Popup: Rendered when a selectedSpace exists(a user selects a space) and closeSpacePopup is false.
            - Reset our closeSpacePopup to its default value of false. Think of it as on every new selectedSpace, we are restarting the SpacePopup user flow.
            - Set our selectedSpace.
        - Call our fetchMemories function: Get all of that space's memories by passing in the _id field of our space.

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

- # 2e: Define our AddMemory form states & import our necessary AddSpacePopup icons
- Icons Source: https://react-icons.github.io/react-icons/search/#q=add 
- MdAddCircleOutline: In our Space Popup, a user will be able to click on a plus button to render an AddMemory Form
- IoIosCloseCircle : To close our Space Popup. This will set our closeSpacePopup to true.
- showAddMemory: Keeps track of rendering our AddMemory form inside our AddSpacePopup. By default, initialized to false. Only rendered when a user clicks on the add icon.
- feelings[]: Stores our possible feelings options for our AddMemory form.

    import { IoIosCloseCircle } from "react-icons/io";
    import { MdAddCircleOutline } from "react-icons/md";

    const [showAddMemory, setShowAddMemory] = useState(false); 
    const [addMemoryTitle, setAddMemoryTitle] = useState("");
    const [addMemoryDescription, setAddMemoryDescription] = useState("");
    const [addMemoryActiveFeeling, setAddMemoryActiveFeeling] = useState("");
    const [addMemoryDate, setAddMemoryDate] = useState(null);
    const [addMemoryImages, setAddMemoryImages] = useState([]);
    
    const feelings = ["joy", "ache", "longing", "accepted", "nostalgic", "alive"];

- # 2f: Render our Space Popup
- Conditionally render when our selectedSpace exists(a marker is selected by the user) and closeSpacePopup is false
- onClick X Button: Stop rendering our SpacePopup and reset our SpacePopup user flow.
    - Close SpacePopup
    - Reset our selected space
    - Reset our memories state because memories only exist if we have a selectedSpace that it is referring to.
    - Reset our AddMemory Form user flow too because the form only exists if we have a selectedSpace.
        - Stop rendering AddMemoryForm
        - Clear all of AddMemoryForm fields to their default empty values
- Header
    - Rendering our space details
    - lastVisited field: Recall lastVisited is initialized to null when a space is first created. 
        - If lastVisited is "truthy"(not null), then that means we added at least 1 memory, so there's a valid date saved for lastVisited. We'll display an actual saved date for the lastVisited 
        - If lastVisited is "falsy"(null), then we'll display a message for that field, informing the user to add a memory.
    - onClick Add Button: Render our AddMemory form by setting the state variable showAddMemory to true.

    {(selectedSpace && !closeSpacePopup) ?
    <div className="relative z-[500] flex w-full h-full" >

        {/**Put our space Description Popup on the right side of our screen */}
        <div className="absolute right-0 flex flex-col w-1/3 h-full justify-center items-center bg-white rounded-lg p-4 gap-4">
            
            {/**Put our x button on top left corner of our popup*/}
            <IoIosCloseCircle className="absolute top-1 left-1 text-[20px] text-red-400 hover:cursor-pointer"
                onClick={() => {
                    setCloseSpacePopup(true);  
                    setSelectedSpace(null); 
                    setMemories([]);

                    setShowAddMemory(false);
                    setAddMemoryTitle("");
                    setAddMemoryDescription("");
                    setAddMemoryActiveFeeling("");
                    setAddMemoryImages([]);
                }}
            />

            {/**Header */}
            <div className = "flex flex-col items-center w-full gap-4">
                <div className = "flex flex-col items-center w-full gap-2">
                    <h1 className="text-[30px] font-semibold text-sky-400 text-center">{selectedSpace.name}</h1>
                        <span className="text-[12px]">{selectedSpace.display_name}</span>
                </div>
                                
                <div className="flex justify-between items-center w-3/4">
                    <span className="text-[15px]">
                        Last Visited: {selectedSpace.lastVisited ? selectedSpace.lastVisited : `N/A, add a memory!`}
                    </span>
                    <MdAddCircleOutline className="text-[20px] text-sky-400 font-semibold hover:cursor-pointer"
                        onClick={()=>{setShowAddMemory(true)}}/>
                </div>
            </div>
        </div>
    </div>
    : null}

3. Map.jsx: Create our AddMemory Form(conditionally rendered inside our AddSpace Popup)

- # 3a. Install our DatePicker library
- Our DatePicker will be used for the date input field for the AddMemory form
- Source: https://mui.com/x/react-date-pickers/date-picker/ 
- Source: https://mui.com/x/react-date-pickers/quickstart/ 
- In our frontend directory, install the MUI X DatePicker Library and a date library. Also, install the @mui/material peer dependencies
    - cd memory-map-fixed/client/memoryMap
    - npm install @mui/x-date-pickers
    - npm install dayjs
    - npm install @mui/material @emotion/react @emotion/styled

- # 3b. App.jsx:  Integrate the Localization Provider and the Date Adapter
- Import the adapater that corresponds to our chosen date library. For dayjs, this is the AdapterDayjs adapter.
- Import the localization provider
- To integrate our chosen date library with the Date Pickers, wrap our app with the Localization Provider and pass the date adapter to the Localization Provider's dateAdapter prop

    import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
    import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

    import Map from '../pages/Map';

    function App() {


        return (
            <>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Routes>
                    <Route path="/" element={<Map />}></Route>
                </Routes>
            </LocalizationProvider>

            </>
        )
    }

- # 3c: Map.jsx: Render our AddMemoryForm and incorporate our DatePicker into the form
- Conditionally render our AddMemoryForm with the showAddMemory state
- Import our DatePicker and our date library

    import { DatePicker } from '@mui/x-date-pickers';
    import dayjs from 'dayjs';

- Add the AddMemoryForm code snippet below our Header in our SpacePopup
    - addMemoryTitle input
    - addMemoryActiveFeeling input
        - Map our feelings array with the different feelings options into seperate divs that the user can select.
        - onClick feeling: This feeling becomes the active feeling.
    - addMemoryDate input
        - Use our DatePicker Component
        -  onChange = {(date)=>{setAddMemoryDate(date);}: recieve a date object that the user selected in our date library format(dayjs format).
    - addMemoryDescription input
        - Use a <textarea> component, so we can recieve multi-line input
    - addMemoryImages input
        - type: file
        - multiple prop set to true: allow for multiple files to be inputted
        - onChange = {(event)=>{setAddMemoryImages(event.target.files)}}: Instead of updating our state to event.target.value, use the files field of event.target to access the FileList array-like object
    - onSubmit: Call handleAddMemory() function when user submits the AddMemory Form

   
    {showAddMemory? 
        <div className = "w-full">
            <form className = "flex flex-col bg-gray-100 rounded-lg w-full items-center p-4 gap-5" onSubmit = {handleAddMemory}>
                <input type = "text" 
                    value = {addMemoryTitle} 
                    placeholder="Add a memory title" 
                    onChange = {(event)=>{setAddMemoryTitle(event.target.value)}}
                    className = "text-[18px] text-center text-gray-800 focus:outline-none w-full p-2 border-b-2 border-sky-400"
                >
                </input>
                                                
                <div className="flex gap-2 justify-center items-center">
                    {feelings.map((feeling, i)=>{
                        return  (
                            <div key = {i} 
                                className={`border-1 border-sky-400 p-2 text-[12px] rounded-xl ${addMemoryActiveFeeling === feeling ? "bg-sky-400": ""}`}
                                onClick={() => { setAddMemoryActiveFeeling(feeling) }}
                            >{feeling}</div>)
                    })}
                </div>

                <DatePicker label="Memory Date" 
                    onChange = {(date)=>{setAddMemoryDate(date);}}/>
                                                
                <textarea type = "text" 
                    value = {addMemoryDescription} 
                    placeholder="Add a memory description" 
                    onChange = {(event)=>{setAddMemoryDescription(event.target.value)}}
                    className = "h-50 text-[12px] text-gray-800 w-full focus:outline-none w-full border-2 border-sky-400 rounded-lg p-2">
                </textarea>
                
                <input type = "file" 
                    name = "image" 
                    multiple = {true}
                    onChange = {(event)=>{setAddMemoryImages(event.target.files)}} 
                    className = "bg-sky-400 p-2 rounded-lg"
                >
                </input>
                <button className = "bg-blue-500 rounded-lg p-2 text-[14px] hover:border-[1px] border-sky-200">Add Memory</button>
            </form>
        </div>
    :null}

4. Submit our AddMemory Form from the frontend and save the Memory Document in our backend

- # 4a. Map.jsx: Create our handleAddMemory() function & call our POST "/addMemory" endpoint. 
- Source: https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData
- Source: https://developer.mozilla.org/en-US/docs/Web/API/FormData/append 
-  For file inputs, we can't just wrap all our input fields into an object for our POST body object that we will send to our backend when we call our API endpoint.
- Instead, for file inputs, we need to use the FormDataConstructor
    - FormDataConstructor: for file uploading like uploading images.
    - Create a FormData Object where the key:value pairs are fieldName: userSubmittedValue
    - addMemoryImages: For FormData Object, we can append multiple values with the same key name. This is how we'll simulate passing in an array of images, assign all of the user's inputted images to the same key name.
- Post body: memoryFormData
- headers Object: Pass in a headers object so the backend knows how to parse the incoming request body.
    - Set our Cntent-Type field to "multipart/form-data"
- .then: Reset our AddMemory User flow
    - Stop displaying the AddMemory form
    - Clear the AddMemory form input fields
    - fetchMemories(selectedSpace._id): We added a memory to this space, but our frontend doesn't know our memories collection in our MongoDB database changed, so retrieve our Memory documents and update our memories state on the frontend. Triggers a re-rendering of our memories UI for our currently opened SpacePopup.
    - getUpdatedSpace(selectedSpace._id): We added a memory to this space, meaning our lastVisited field for this space may have changed in our Space document in our MongoDB database. But, our frontend selectedSpace doesn't know its corresponding Space document in our database may have changed, so retrieve our Space document and update only this updatedSpace document in our spaces state on the frontend. Triggers a re-rendering for SpacePopup if our lastVisited field of our selectedSpace changed.


    function handleAddMemory(event){
        event.preventDefault();

        const memoryFormData = new FormData();
        memoryFormData.append("title", addMemoryTitle);
        memoryFormData.append("feeling", addMemoryActiveFeeling);
        memoryFormData.append("memoryDate", addMemoryDate);
        memoryFormData.append("description", addMemoryDescription);
        memoryFormData.append("spaceId", selectedSpace._id);

        for (let i = 0; i< addMemoryImages.length; i++){
            memoryFormData.append("images", addMemoryImages[i]);
        }
        
        // for (let [key, value] of memoryFormData.entries()) {
        //    console.log(`${key}:`, value);
        // }

        axios.post("http://localhost:3000/addMemory", memoryFormData, 
            {headers: {
                "Content-Type": "multipart/form-data",
            }}).then((response)=>{
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
- # 4b. Map.jsx: Write handleAddMemory's helper function getUpdatedSpace() & call our GET "/getSpace" endpoint.
- As we mentioned in the previous step, when we add a memory to the selectedSpace, this may change the selectedSpace's lastVisited field. When we save a memory to our memories collection in our MongoDB database, we call fetchMemories() to reflect our collection changing into our frontend memories state.
- We need to do the same for our frontend selectedSpace and our spaces state. When we add a memory and change the lastVisited field for our selectedSpace document in our spaces MongoDB collection, our frontend doesn't know our corresponding selectedSpace Document or our spaces collection in our database changed. 
- Call getUpdatedSpace to update:
    - spaces state: Specifically, we will only replace the updatedSpace document with its old document in our frontend spaces state.
    - selectedSpace state: We will also replace the previous selectedSpace state with our updatedSpace document retrieved from the backend.
- We will get our specific Space document by passing in the _id field of the space into our getUpdatedSpace function

    function getUpdatedSpace(spaceId){
        axios.get("http://localhost:3000/getSpace", {params : {spaceId}}).then((response)=>{
            
            const updatedSpace = response.data;
            
            //After we save a memory to the memories collection, the corresponding Space document's lastVisited field may change, so we need to 
            // update that space in our frontend spaces state.
            //Why: If a user closes the SpacePopup after adding a memory to the space and then reopens the same space, we will see the
            // lastVisited field reverted back to the old lastVisited(from b4 the memory was added).
            //This error occurs because our selectedSpace and therefore SpacePopup is rendered based on the spaces state and we didn't update our
            // updatedSpace in the frontend spaces state, so our SpacePopup is rendering the old spaces state with the old Space document.
            setSpaces((spaces)=>{
                return spaces.map( space =>
                    space._id == updatedSpace._id ? updatedSpace : space
                )
            })
            
            setSelectedSpace(updatedSpace);

        }).catch((err)=>{
            console.log(err);
        })
    } 

- # 4c. app.mjs: Write our GET "/getSpace" endpoint
- Return a single Space document that matches our req.query.spaceId
- Aggregation pipeline returns an array of results, even if we are matching based on the document unique _id field. 
- Aggregation pipeline will return an array of 1 Space document, so return the first element in the array

    app.get("/getSpace", async (req, res)=>{
        const space = await Space.aggregate([
            {
                $match: {_id: new mongoose.Types.ObjectId(`${req.query.spaceId}`)}
            },
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
                            date: "$lastVisited"
                        },
                    },
                }
            }]
        );
        console.log("my 1 space from backend, ", space[0]);
        res.json(space[0]);
    });

- # 4d. Write our POST "/addMemory" endpoint.
- We will need to install a few libraries:
    - multer: Used for handling sending FormData object to the backend. Gives us access to req.body to contain text fields and req.files to contain the files.
        - Source: https://expressjs.com/en/resources/middleware/multer.html
            
            cd server
            npm install multer

    - cloudinary: Cloud storage service that offers unlimited storage space. Easy way to upload images to an external service so that my MongoDB database stays lightweight(don't save files directly to MongoDB). Save our images to cloudinary, and save the provided secure_urls into our MongoDB database. The secure_urls still allow us access to the uploaded images.
        - Source: https://www.youtube.com/watch?v=2Z1oKtxleb4
        - On Cloudinary website "Getting Started," choose Node.sdk

            cd server
            npm install cloudinary

- # app.mjs: Incorporate Multer first
- Import multer & configure multer
    - Configure a directory to save these file uploads to. Pass in {dest: 'uploads/'} config. The config says to save our uploads to the destination of a directory named uploads. For the first upload, automatically creates a uploads directory.
    
        import multer from 'multer';
        const upload = multer({ dest: 'uploads/' }) 

- For the POST "/addMemory" API endpoint defintion, add in extra middleware.
    - upload.array("images"): Upload multiple files from the FormData key "images". This is our key in the FormData where we saved all our images.
        - With this middleware, we will now have acces to:
            - req.files will now contain our array of files. Where each file will contain important fields like originalname, destination, filename,and path in our saved folder.
            - req.body will now contain our text fields

        app.post("/addMemory", upload.array("images"), async(req,res)=>{...});

- # app.mjs: Incorporate Cloudinary
- Import cloudinary 

    import {v2 as cloudinary} from 'cloudinary'; 

- Configure our cloudinary account in cloudinary.config()
    - Add our cloudinary account credentials in our .env file
    - api_key and api_secret allows us to upload our image
- imageResults [] array: Store all our secure_urls from our images that are returned back from cloudinary. This array will be saved to mongodb in our Memory document under the "images" field.
    - imageResults.push(result.secure_url)
- cloudinary.uploader.upload(req.files[i].path): Iterate through our images array(each image saved in req.files), and upload all our images to cloudinary with the file path in our /uploads directory.

- Update the lastVisited field for the memory's referenced Space document
    - if the Space document's lastVisited field is null(falsy) --> update the lastVisited field to this first memory's date.
    - if the Space's document lastVisited is less recent(<) than the incoming memory's date field --> update the lastVisited field to this incoming memory's date.
        - new Date(req.body.memoryDate): Our incoming date from the frontend is not a valid date object, so we need to convert it b4 comparison.
        - correspondingSpace.lastVisited: Recall in our schema, we enforced this field to of type Date Object, so we don't need to convert it.

- const newMemory = new Memory(...), newMemory.save(): create a new Memory document and save it to our memories collection.

    app.post("/addMemory", upload.array("images"), async(req,res)=>{
        
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });


        let imageResults = [];
   

        //Iterate through our images array, and upload all our images to cloudinary
        for (let i = 0; i< req.files.length; i++){
            const result = await cloudinary.uploader.upload(req.files[i].path).catch((error) => {
                console.log(error);
            });; 

            console.log("image index ", i, ": ", result);
            imageResults.push(result.secure_url); //Only add the Cloudinary secure urls to our results array that will be saved to mongodb
        }

        console.log("cloudinary upload ", imageResults);

        const correspondingSpace = await Space.findById(req.body.spaceId);
 
        if (!correspondingSpace.lastVisited || new Date(req.body.memoryDate) > correspondingSpace.lastVisited) {
            correspondingSpace.lastVisited = new Date(req.body.memoryDate);
            await correspondingSpace.save(); //update our correspondingSpace.lastVisited field
            console.log("my corresponding space after update lastVisited", correspondingSpace);
        }

        const newMemory = new Memory({
            title: req.body.title,
            feeling: req.body.feeling,
            memoryDate: new Date(req.body.memoryDate),
            description: req.body.description,
            images: imageResults,
            spaceId: new mongoose.Types.ObjectId(`${req.body.spaceId}`),
        });

        console.log("this is our newMemory", newMemory);

        try{
            await newMemory.save();
            res.json({success: `Check out your new memory at space ${correspondingSpace.name}!`})
        }catch(err){
            res.json({error: "Failed to add memory. Try again later."});
        }
    })

* * Now, we have finished most of Space Popup logic. We finished our Add Memory logic. In our next commit, we will work on the UI for rendering the memories in our Space Popup.