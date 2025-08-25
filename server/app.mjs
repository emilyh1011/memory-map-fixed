import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from "dotenv"
import path from 'path'
import { fileURLToPath, URLSearchParams } from 'url';
import { Space } from './db.mjs';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
//app.use(express.static(path.join(__dirname, 'src')));

app.use(cors());

//body parsing middleware for urlencoded bodies, places parsed body into req.body
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

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
        }]
    );
    console.log("in backend, all my spaces: ", spaces);
    res.json(spaces);
})

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

//API Get request for nominatim forward geosearching
//In the frontend, we passed in a params object. To access the params object in the backend, use req.query.
//To access our variable wrapped in the object, req.query.variableName
app.get("/search-bar", async (req, res) => {
    console.log(req.query);
    let url;
    const params = new URLSearchParams({ format: 'jsonv2', limit: '8', addressdetails: '1' });

    if (req.query.simpleQuery) {

        url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(req.query.simpleQuery)}`;
    } else { //If this key DNE, then we passed params object from StructuredSearch
        console.log("in structured", req.query);
        //Iterate over our query object as an array of [key,value] pairs
        const queryAsKeyValuePairs = Object.entries(req.query);
        console.log(queryAsKeyValuePairs);
        for (const [key, value] of queryAsKeyValuePairs) {

            //Only include the params that aren't empty string or just spaces
            if (value.trim() !== "") {
                params.append(key, value);
            }
        }

        console.log(params.toString());

        url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
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

console.log(process.env.PORT);
//Right now, while we are developing, start server at port 3000
app.listen(process.env.PORT || 3001);