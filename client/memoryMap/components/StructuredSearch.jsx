import { useState, memo } from 'react';
import axios from 'axios';

const StructuredSearch = memo(function StructuredSearch({activeSearchResult, handleActiveSearchResult}) {

    const [street, setStreet] = useState("");
    const [city, setCity] = useState("");
    const [county, setCounty] = useState("");
    const [state, setState] = useState("");
    const [country, setCountry] = useState("");
    const [postalcode, setPostalcode] = useState("");
    const [results, setResults] = useState([]);
    
    function handleStructuredSearch(e){
        e.preventDefault();
        axios.get("http://localhost:3000/search-bar", {params: {street, city, county, state, country, postalcode}}).then((response)=>{
            console.log(response.data);
            setResults(response.data);
        }).catch((err)=>{
            console.log(err);
        });
    }


    return (
        <>
            <form className="flex flex-row gap-2 items-center">
                <div className="flex flex-col bg-white justify-center h-[60px] rounded-md shadow-md shadow-gray-700 pl-[8px]">
                    <input type="text" value={street} placeholder="House Number/Street" onChange={(event) => { setStreet(event.target.value) }}
                        className="w-full h-full font-merriweather text-[18px] pl-2 focus:outline-none"></input>
                </div>
                <div className="flex flex-col bg-white justify-center h-[60px] rounded-md shadow-md shadow-gray-700 pl-[8px]">
                    <input type="text" value={city} placeholder="City" onChange={(event) => { setCity(event.target.value) }}
                        className="w-full h-full font-merriweather text-[18px] pl-2 focus:outline-none"></input>
                </div>
                <div className="flex flex-col bg-white justify-center h-[60px] rounded-md shadow-md shadow-gray-700 pl-[8px]">
                    <input type="text" value={county} placeholder="County" onChange={(event) => { setCounty(event.target.value) }}
                    className="w-full h-full font-merriweather text-[18px] pl-2 focus:outline-none"></input>
                </div>
                <div className="flex flex-col bg-white justify-center h-[60px] rounded-md shadow-md shadow-gray-700 pl-[8px]">
                    <input type="text" value={state} placeholder="State" onChange={(event) => { setState(event.target.value) }}
                    className="w-full h-full font-merriweather text-[18px] pl-2 focus:outline-none"></input>
                </div>
                <div className="flex flex-col bg-white justify-center h-[60px] rounded-md shadow-md shadow-gray-700 pl-[8px]">
                    <input type="text" value={country} placeholder="Country" onChange={(event) => { setCountry(event.target.value) }}
                    className="w-full h-full font-merriweather text-[18px] pl-2 focus:outline-none"></input>
                </div>
                <div className="flex flex-col bg-white justify-center h-[60px] rounded-md shadow-md shadow-gray-700 pl-[8px]">
                    <input type="text" value={postalcode} placeholder="Zip Code" onChange={(event) => { setPostalcode(event.target.value) }}
                    className="w-full h-full font-merriweather text-[18px] pl-2 focus:outline-none"></input>
                </div>
                <button onClick = {handleStructuredSearch}>Search</button>
            </form>
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

export default StructuredSearch