import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from "dotenv"
import path from 'path'
import { fileURLToPath, URLSearchParams } from 'url';
import { Space, Memory } from './db.mjs';
import multer from 'multer';
const upload = multer({ dest: 'uploads/' }) 
import {v2 as cloudinary} from 'cloudinary'; 

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
                        date: "$lastVisited"
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

app.get("/getAllMemories", async (req, res) => {

    const memories = await Memory.aggregate([
        {
            $match: { spaceId: new mongoose.Types.ObjectId(`${req.query.spaceId}`) }
        },
        { $sort: { memoryDate: -1 } },
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

//Add in extra middleware.
app.post("/addMemory", upload.array("images"), async(req,res)=>{
    
    console.log("in backend, my body, text fields according to multer ", req.body);
    console.log("in backend, my files, file fields according to multer", req.files); 
    
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


    //Update lastVisited field of the space document that this new memory will refer to 
    const correspondingSpace = await Space.findById(req.body.spaceId);

    console.log("my corresponding space before", correspondingSpace);
   
    // space.lastVisited is null(falsy) --> first memory we are adding, update correspondingSpace.lastVisited
    // New memory date is more recent --> update correspondingSpace.lastVisited
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
                        format: "%B %d, %Y",
                        date: "$lastVisited"
                    },
                },
            }
        }]
    );
    console.log("my 1 space from backend, ", space[0]); //aggregate pipeline returns an array of results. We will get an array of 1 document.
    res.json(space[0]);
});

console.log(process.env.PORT);
//Right now, while we are developing, start server at port 3000
app.listen(process.env.PORT || 3001);