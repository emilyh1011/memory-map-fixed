import { useState, memo, useEffect } from 'react'
import { FaSearch } from "react-icons/fa";
import axios from 'axios';

const SimpleSearch = memo(function SimpleSearch({activeSearchResult, handleActiveSearchResult, setActiveSearchResult, results, setResults}) {

    const [simpleQuery, setSimpleQuery] = useState("");
    const [isSearchBarFocused, setIsSearchBarFocused] = useState(false); //New state to track when to hide the results bar. Hide the results bar only when a user clicks out of search bar(not focused) and when a user activates a search result(activeSearchResult exists)

    //On choosing SimpleSearch, reset any possible previous activeSearchResult and searchResults from StructuredSearch
    useEffect(()=>{
        setActiveSearchResult()
        setResults([]);
    },[]);

    async function handleSearch(e) {

        e.preventDefault(); //Prevent default action of page reloading after form submission
        setResults([]); //Reset previous search results when user makes a new search.
        setActiveSearchResult(null); //Whenever user makes a new search, the previous activeSearchResult resets because user needs to reselect a new one
                                    // Ensures we correctly reset the activeSearchResult user flow on every new search. For explanation, check projectProgress2.md, 5c

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

    return (
        <>
            <form className="flex flex-row bg-white items-center w-md p-5 rounded-md shadow-md shadow-gray-700 pl-[8px]"
                onSubmit={handleSearch}>
                <FaSearch className="text-blue-400" />
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
            </form>

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
        </>
    )
});

export default SimpleSearch;