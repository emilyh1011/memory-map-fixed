Commit 3: Make Search Results Interactive
# Source: Passing props from Child to Parent Component: https://dev.to/bcostaaa01/how-to-pass-props-from-child-to-parent-component-in-react-1ci4 
- Recall: We created a results[] state in our SimpleSearch.jsx and StructuredSearch.jsx to keep track of our search results state
- Now, we want to make the search results UI from our child components interactive. 
- When a user clicks on a search result, we want to return this activeSearchResult object to our parent Map.jsx component, so that our Map component can render some UI

1. Initialize the state variable in the parent component: Map.jsx
    - We will pass this state variable(for styling purposes in child component) as a prop from our parent Map.jsx to its child components(Search.jsx, StructuredSearch.jsx)
    - Previously, we defined results as a state in their children components. Now we will delete the state definition from those files. 
    - results state will be necessary in the future handleAddSpace() userflow, so let's redefine the results state in Map.jsx and pass results and its updater function setResults as props to the children components

        const [activeSearchResult, setActiveSearchResult] = useState(null);
        //For react-leaflet, their methods accept points. Easiest way: [latitude, longitude]
        const [activeSearchResultPosition, setActiveSearchResultPosition] = useState([]); //Create a state to track activeSearchResult position too
        const [results, setResults] = useState([]);

2. Initialize a callback function handleActiveSearchResult in the parent component: Map.jsx
- Along with passing activeSearchResult as a prop from the parent Map.jsx, we need a way to update our state variable while its in the child component
- To do this, we also need to pass our updater function setActiveSearchResult as a prop.
- * However, passing function props from a parent component to a child component is tricky. Passing a regular function to a child component can cause uncessesary re-renders. We are passing a different function reference(even if function body hasn't changed) as a prop on every render, React sees it as a different prop --> Map.jsx will re-render --> It's children will also re-render by default. Meaning our function won't be stable.

- * useCallback(fn, [dependencies]) hook: Wrap our updater function setActiveSearchResult within a function in our useCallback() hook. This will cache/stabilize our function definition and return the same function reference between renders(until dependencies change). Pair with memoizing the Child components will skip unecessary re-renders if the dependencies are the same. Improves performance!!
    - [dependencies]: Include all variables within our component used inside our callback function. Doesn't include function parameters.
    - For initial render, we will call our fn function(ex: reference is 1) that we passed into useCallback()
    - On following renders, if none of the dependencies have changed, useCallback() will continue to return the same function as first render(fn function with reference 1).
    - Otherwise, if one of the dependencies have changed, useCallback() will call another version of our fn function(fn function with reference 2).
# useCallback() & memo in Child component Source(Skipping re-rendering of components): https://react.dev/reference/react/useCallback#skipping-re-rendering-of-components

    /When we want to update the activeSearchResult state from the child components, we will call this callback 
    //function that is defined here in our parent Map.jsx.
    const handleActiveSearchResult = useCallback((r)=>{
        setActiveSearchResult(r);
        const positionLatitude = parseFloat(r.lat);
        const positionLongitude = parseFloat(r.lon);
        //console.log("our parsed position, ", positionLatitude, positionLongitude);
        setActiveSearchResultPosition([positionLatitude, positionLongitude]);
        mapRef.current.flyTo([positionLatitude, positionLongitude], 15);
    }, [])

3. Pass our callback function handleActiveSearchResult and state variable activeSearchResult down to the Child components as props
    - Update our conditional rendering line of SimpleSearch.jsx and StructuredSearch.jsx
    - Also, pass down our results & setResults updater function as props

     {isSimpleSearch? 
        <SimpleSearch activeSearchResult = {activeSearchResult} handleActiveSearchResult = {handleActiveSearchResult} 
            results = {results} setResults = {setResults}/> 
        : <StructuredSearch activeSearchResult = {activeSearchResult} handleActiveSearchResult={handleActiveSearchResult} 
            results = {results} setResults = {setResults}/>} 

4. Memoize our Child Component definitions that use our callback function
    - We will memoize the child components definitions, so that whenever this callback function is called in our child components, 
    - React will return the same function reference as long as our dependencies don't change.
    - Improves performance because we will stop unecessary re-renders.

    const SimpleSearch = memo(function SimpleSearch({activeSearchResult, handleActiveSearchResult, results, setResults}) {...});
    const StructuredSearch = memo(function SimpleSearch({activeSearchResult, handleActiveSearchResult, results, setResults}) {...});

5. Display Search Results logic, handling activeSearchResult logic, & styling in our child components: SimpleSearch.jsx, StructuredSearch.jsx
   
   # 5a. Define a new state: isSearchBarFocused & add an onFocus() event handler for our input fields
   - This state will track when to hide the search results bar
   - We will hide the search results bar only when a user clicks out of search bar(not focused) AND when search results don't exist(results array is empty by defauly)
   
   const [isSearchBarFocused, setIsSearchBarFocused] = useState(false); 

   - Update all our input fields for our Search Components to have an onFocus() field
   - Example from updating SimpleSearch.jsx:

        <input
            type="text"
            name="searchbar"
            value={simpleQuery}
            placeholder="Search a location name"
            onChange={(event) => {
                setSimpleQuery(event.target.value);
            }}
            onFocus={()=>{ setIsSearchBarFocused(true)}} //When user is focused on search input bar, then search bar is focused
            className='w-full h-full font-merriweather text-[18px] pl-2 focus:outline-none'
        >
        </input>
   
    # 5b. In our div to display results, write the selecting activeSearchResult user flow logic:
    - Add an onClick{()=>{}}: This will be where we call our parent callback function handleActiveSearchResult to update our activeSearchResult state
        - We will also setIsSearchBarFocused(false) here because a user chose a result and search bar is no longer focused --> hide our search results
        - We will only display search results when search results exist and search bar is focused
    - Update the className="" styling for hovering over a search result and clicking on the activeSearchResult
    
       {/**Display results vertically, flex-col
        * w-full, so same as parent. We want the results to be same width as search bar
        * Only display when results exist and search bar is focused
        */}
        {results.length>0 && isSearchBarFocused?
            <div className={`flex flex-col justify-center w-md mt-[5px]`}>
                {results.map((result) => {
                    return <div 
                        key = {result.place_id}
                        onClick={()=>{
                            setIsSearchBarFocused(false); //User clicked out of search bar(search bar no longer focused), user activated a search result
                            handleActiveSearchResult(result);
                        }}
                        className = {`w-full rounded-md p-[4px] pl-[8px] hover:bg-gray-100 ${activeSearchResult && activeSearchResult.place_id == result.place_id? "bg-gray-200": "bg-white"}`}
                        >{result.display_name}</div>
                })}
            </div>: null
        }

    # DON'T SKIP: 5c. Resetting activeSearchResult on a new search
    - When a user makes a search, our onSubmit(for SimpleSearch) or our onClick(for StructuredSearch because we use a button) will be called.
    - Intuitively, whenever a user makes a new search, the previous activeSearchResult should be cleared because that was based on previous search results.
    - Update our handleSearch() functions that we wrote in our previous commmit(projectProgress1.md)
    - * * RESETTING activeSearchResult is important for our next commit (projectProgress3.md)!!!!
        - Next commit: Logic for asking user if they would like to add their non-space activeSearchResult as a new space***
        - (Our popup only appears if activeSearchResult is not null and checkLocationIsInSpaces is false)
        - So resetting our activeSearchResult to null  effectively restarts our activeSearchResult user flow on every new search
    
    - Map.jsx: We need to first add a new setActiveSearchResult prop to pass the state updater function defined in our Map.jsx to its children search components

        <div className="fixed top-20 left-5 z-500">
            {isSimpleSearch? 
                <SimpleSearch activeSearchResult = {activeSearchResult} handleActiveSearchResult = {handleActiveSearchResult} 
                    setActiveSearchResult={setActiveSearchResult} results = {results} setResults ={setResults}/> 
                : <StructuredSearch activeSearchResult={activeSearchResult} handleActiveSearchResult={handleActiveSearchResult} 
                    setActiveSearchResult={setActiveSearchResult} results = {results} setResults ={setResults}/>} 
        </div>

    - SimpleSearch.jsx updated function definition header for added prop(do same for StructuredSearch.jsx):

        const SimpleSearch = memo(function SimpleSearch({activeSearchResult, handleActiveSearchResult, 
            setActiveSearchResult, results, setResults}){---component body goes here---});

     - Updated handleSearch() function(add same setActiveSearchResult(null) and setResults([]) to StructuredSearch.jsx): 
    
        async function handleSearch(e) {

            e.preventDefault(); //Prevent default action of page reloading after form submission
            setResults([]); //Reset previous search results when user makes a new search.
            setActiveSearchResult(null); //Whenever user makes a new search, the previous activeSearchResult resets because user needs to reselect 
                                        // Ensures we correctly reset the activeSearchResult user flow on every new search.

            //Only let search go through if user didn't submit just spaces or an empty string search,
            if (simpleQuery.trim() !== "") {
                //axios.get: has an optional second parameter for passing in a params object. In the backend, our params object will be accessed as req.query.
                //Params object: expects an object; We need to wrap our simpleQuery variable into an object
                axios.get("http://localhost:3000/search-bar", { params: { simpleQuery } }).then((response) => {
                    console.log(response);
                    console.log(response.data);
                    setResults(response.data);
                }).catch((err) => {
                    console.log(err);
                })

            }
        }

   
** Next commit: we will move to connecting our MongoDB database for "spaces." Before we can continue with the conditional rendering on the map to check if a search result is already in our user's spaces database to see if we need to render a popup to add the space, we need to add the database**

