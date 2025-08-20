import { useState, memo } from 'react'
import { FaSearch } from "react-icons/fa";
import axios from 'axios';

const SimpleSearch = memo(function SimpleSearch({activeSearchResult, handleActiveSearchResult}) {

    const [simpleQuery, setSimpleQuery] = useState("");
    const [results, setResults] = useState([]);

    async function handleSearch(e) {
        e.preventDefault(); //Prevent default action of page reloading after form submission
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

    return (
        <>
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

            {/**Display results vertically, flex-col
            * w-full, so same as parent. We want the results to be same width as search bar
            */}
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
        </>
    )
});

export default SimpleSearch;