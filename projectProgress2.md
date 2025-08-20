Commit 3: Make Search Results Interactive
# Source: Passing props from Child to Parent Component: https://dev.to/bcostaaa01/how-to-pass-props-from-child-to-parent-component-in-react-1ci4 
- Recall: We created a results[] state in our SimpleSearch.jsx and StructuredSearch.jsx to keep track of our search results state
- Now, we want to make the search results UI from our child components interactive. 
- When a user clicks on a search result, we want to return this activeSearchResult object to our parent Map.jsx component, so that our Map component can render some UI

1. Initialize the state variable in the parent component: Map.jsx
    - We will pass this state variable(for styling purposes in child component) as a prop from our parent Map.jsx to its child components(Search.jsx, StructuredSearch.jsx)

        const [activeSearchResult, setActiveSearchResult] = useState(null);

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

    //When we want to update the activeSearchResult state from the child components, we will call this callback 
    //function that is defined here in our parent Map.jsx.
    const handleActiveSearchResult = useCallback((r)=>{
        setActiveSearchResult(r);
    }, [])

3. Pass our callback function handleActiveSearchResult and state variable activeSearchResult down to the Child components as props
    - Update our conditional rendering line of SimpleSearch.jsx and StructuredSearch.jsx

     {isSimpleSearch? <SimpleSearch activeSearchResult = {activeSearchResult} handleActiveSearchResult = {handleActiveSearchResult}/> : <StructuredSearch activeSearchResult = {activeSearchResult} handleActiveSearchResult={handleActiveSearchResult}/>} 

4. Memoize our Child Component definitions that use our callback function
    - We will memoize the child components definitions, so that whenever this callback function is called in our child components, 
    - React will return the same function reference as long as our dependencies don't change.
    - Improves performance because we will stop unecessary re-renders.

    const SimpleSearch = memo(function SimpleSearch({activeSearchResult, handleActiveSearchResult}) {...});
    const StructuredSearch = memo(function SimpleSearch({activeSearchResult, handleActiveSearchResult}) {...});

5. Update our display search results logic & styling in our child components: SimpleSearch.jsx, StructuredSearch.jsx
    - Add an onClick{()=>{}}: This will be where we call our parent callback function handleActiveSearchResult to update our activeSearchResult state
    - Update the className="" styling for hovering over a search result and clicking on the activeSearchResult
        <div className="flex flex-col justify-center w-md mt-[5px]">
            {results.map((result) => {
                return <div 
                    key = {result.place_id}
                    onClick={()=>{
                        handleActiveSearchResult(result);
                    }}
                    className = {`w-full rounded-md p-[4px] pl-[8px] hover:bg-gray-100 ${activeSearchResult && activeSearchResult.place_id == result.place_id? "bg-gray-200": "bg-white"}`}
                    >{result.display_name}</div>
            })}
        </div>


** In our next commit, we will move to connecting our MongoDB database for "spaces." Before we can continue with the conditional rendering on the map to check if a search result is already in our user's spaces database to see if we need to render a "plus sign" to add the space, we need to add the database.**

