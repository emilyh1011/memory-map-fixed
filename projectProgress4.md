Commit 5: Fixing "/addSpace" POST call for an activeSearchResult recieved from StructuredSearch.jsx
- At the moment, the addSpace call fails because activeSearchResult recieved from StructuredSearch.jsx has an empty string for the name field
- To fix this, let's add some user logic for rendering an "AddName" popup to add a location name when activeSearchResult.name is empty string

1. Map.jsx: Define 2 new states
- askLocationName: Keeps track of if we need to display/hide the UI for asking for a location name. The "AddName" popup.
- userInputName: Keeps track of the location name inputted by the user in the "AddName" popup.

    const [userInputName, setUserInputName] = useState(""); 
    const [askLocationName, setAskLocationName] = useState(false);

2. Map.jsx: Add a new check for displaying our "Add Space?" Popup & update "Add Space?" Popup Logic
- We don't want our "Add Space?" Popup and "AddName" Popup displaying at the same time.
- "AddName" Popup should only display after a user clicks "yes" on the "Add Space?" popup, and it's found that the activeSearchResult.name is an empty string

    # 2a. Add a requirement for conditional rendering "AddSpace?" Popup:
    -Only display our "AddSpace?" Popup if activeSearchResult exists AND the activeSearchResult isn't already a space AND our askLocationName is false meaning "AddName" popup isn't being displayed.
    
        {(activeSearchResult && !checkLocationInSpaces() && !askLocationName)? .... : null}: 
    
    # 2b. "AddSpace?" Popup, updated "Yes" logic
    - User clicks "Yes" to add a space, we need to now check if activeSearchResult.name is an empty string.
        - if(activeSearchResult.name === ""): We need to ask the user to add a name for this activeSearchResult first before we save it to our "spaces" collection.
            - setAskLocationName(true): Our AddSpace popup will now be hidden because it doesn't meet all requirements, while our AddName popup will now display.
        - else: activeSearchResult.name is a valid string, so we can just save this activeSearchResult to our "spaces" collection instantly.

        <button 
            onClick={()=>{
                if(activeSearchResult.name === ""){
                    setAskLocationName(true); //AddSpace Popup will hide because askLocationName false fails, but our AddName Popup will display
                }else{ //We can instantly save activeSearchResult to our spaces collection
                    handleAddSpace();
                }
            }}
            className = "w-full text-[15px] p-2 rounded-lg bg-green-200 hover:border-[1px] border-sky-200 active:bg-green-300">Yes
        </button>
    
3. Map.jsx: Create our "AddName" Popup UI
- Recall, we always put past popups/messages on the right side of the screen next to the Space Marker or Preview Marker.
- In this case, we hid our Preview Marker from hiding the AddSpace popup, so we currently have no marker in the center of the user's screen.
- So for our AddName Popup, let's change our design choice and move the AddName popup to the middle of the screen to cover up the fact that there's no Preview Marker or Space Marker centered on the screen at the moment. 

    - We will only display our AddName Popup if our askLocationName state is true
    - When a user clicks the "Submit" button, we will only call our POST "/addSpace" API endpoint wrapped in our handleAddSpace() function if the user inputs a valid name, as in not an empty string or just spaces.

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
        </div>
        :null
    }

4. Map.jsx: Update our handleAddSpace() logic
- name: activeSearchResult.name || userInputName.trim(): If our activeSearchResult.name is "", javascript evaluates this as falsy. So, instead, use the name inputted by the user in the AddName popup.
- Resetting our activeSearchResult, AddSpace, and AddName popup flow
    # Reset activeSearchResult user flow
    - setActiveSearchResult(null): Reset activeSearchResult userflow first. "Remove what's under first(AddSpace) then remove what's on top(AddName)"
        - If we added a space without needing to add a name, we instantly remove the AddSpace popup from the screen.
        - If we are currently at AddName Popup, we need to reset activeSearchResult first. If we reset askLocationName first to false, we would correctly remove the AddName Popup from the screen, but the AddSpace Popup would reappear, but we want them both to be gone. So remove what's underneath first.
    - setActiveSearchResultPosition(null)
    - setResults([]): Stop displaying search results. Intuitively, we are no longer searching, so let's reset activeSearchResult flow.

    # Reset previous AddSpace user flow
    - setCloseAddSpaceMessage(false): Reset any previous choice to close addSpace message.

    # Reset AddName User Flow
    -  setAskLocationName(false): Stop displaying AddName popup. If we came from our AddSpace popup only, this line wouldn't do anything. It's just here for if we came from our AddName popup.
    - setUserInputName(""): Clear AddName form, so next time user needs to add a name, the form starts empty.

    # Finish Add Space Logic
    - setAddSpaceMessage(response.data): Save our returned error/success message from our POST "/addSpace" endpoint. Display our success/error addSpaceMessage.
    - fetchSpaces(): Re-render the markers by fetching our spaces collection. Now, our new space also has a marker on the screen.

    function handleAddSpace(){
        axios.post("http://localhost:3000/addSpace", {
            display_name: activeSearchResult.display_name,
            name: activeSearchResult.name || userInputName.trim(),
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

            setAskLocationName(false); 
            setUserInputName("");

            setAddSpaceMessage(response.data);
            fetchSpaces();
        })
    }

* * * Now that we finished with our activeSearchResult --> AddSpace Popup --> AddName --> New Space added to database user flow, let's take a break to try to compartementalize our Map.jsx file into a few different components. We will do this by passing our state variables, updater functions as props and create any necessary callback functions with the useCallback hook for passing functions that have dependencies * *
- We will keep the conditional rendering logic/requirements in Map.jsx, but the Popup/ResultMessage UI for when logic evaluates to true, these will become our components: AddSpacePopup.jsx, AddNamePopup.jsx, ResultAddMessage.jsx

              
5. Memoizing AddSpacePopup.jsx & AddNamePopup.jsx, and wrapping handleAddSpace() in a useCallback() hook
- These are the children components that will call on handleAddSpace()
- Recall, handleAddSpace() is not a state updater function, so it is not automatically stable. When passed to the children components, we only want to call handleAddSpace if the variables that we are using in its POST "/addSpace" body don't change and if in our .then() section our fetchSpaces() function doesn't change.
- Since handleAddSpace() depends on activeSearchResult, activeSearchResultPosition, userInputName in its POST "/addSpace" body and fetchSpaces() in its .then() section, we should wrap handleAddSpace() with a useCallback() hook, such that when these dependencies don't change, we pass the same handleAddSpace() function reference. So, we will skip re-renders when the dependencies are the same by caching the same function reference.
- To skip the re-renders, we need to pair the useCallback() hook on handleAddSpace() with memoizing the child components that will recieve handleAddSpace() as a function prop.

    # 5a. Map.jsx: Wrap handleAddSpace in a useCallback() hook
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

    # 5b. Create components/AddSpacePopup.jsx and components/AddNamePopup.jsx files
    - Memoize these component defintions.
    - In the component defintions, destructure the props.
        - Props are any state variables, state updater functions, and handleAddSpace --> anything we defined in the parent Map.jsx that also needs to be used in our children
    - These components should represent the actual AddSpace Popup UI and AddName Popup UI, as in the UI that is rendered when our conditional rendering for these popups evaluate to true.
    - Refer to actual files to see what we copied in.

    # 5c. Map.jsx: Import & Use our AddSpacePopup and AddNamePopup components
    - Notice, we kept the conditional rendering logic in Map.jsx. 
    - We only moved the UI for when these conditions evaluate to true into our children components.

        {/**User selected a search result && the search result isn't already a space.
        * AddSpace Popup with a Preview Marker*/}
        {(activeSearchResult && !checkLocationInSpaces() && !askLocationName)?
            <>
                <Marker position={activeSearchResultPosition} icon = {previewIcon}></Marker>

                <AddSpacePopup activeSearchResult = {activeSearchResult} setAskLocationName={setAskLocationName} 
                    setActiveSearchResult={setActiveSearchResult} handleAddSpace={handleAddSpace}/>
            </>           
            : null
        }

        {/**AddName Popup */}
        {askLocationName? 
            <AddNamePopup userInputName = {userInputName} setUserInputName={setUserInputName} handleAddSpace={handleAddSpace}/>: null
        }


6. ResultAddSpaceMessage.jsx
- This child component only has a state variable and state updater function as props. State updater functions are stable in React.
- We don't need to memoize this children component because there's no function that we need to wrap in a useCallback() hook.

    # 6a. Create a components/ResultAddSpaceMessage.jsx file
    - This file represents our success/error message after a user attempts to add a space(by making a call to our POST "/addSpace" endpoint)
    - Refer to actual file to see what we copied in.

    # 6b. Map.jsx: Import & use our ResultAddSpaceMessage component
    - Again, we kept our conditional rendering logic in Map.jsx
    - We only moved the UI when our condition evaluates to true into our ResultAddSpaceMessage.jsx file

        {/**The error/success message after use tries to add a space.*/}
        {addSpaceMessage && !closeAddSpaceMessage ? 
            <ResultAddSpaceMessage addSpaceMessage= {addSpaceMessage} setCloseAddSpaceMessage={setCloseAddSpaceMessage}/> : null
        }    

7. Map.jsx: Added import lines for our new children components
    import ResultAddSpaceMessage from '../components/ResultAddSpaceMessage';
    import AddNamePopup from '../components/AddNamePopup';
    import AddSpacePopup from '../components/AddSpacePopup';

* * Stored our original Map.jsx without compartementalizing our AddSpacePopup and AddNamePopup in MapCopy.md. In case we ever need to revert, copy that code back in.