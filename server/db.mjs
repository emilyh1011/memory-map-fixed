import mongoose from 'mongoose';
const {Schema} = mongoose;
import dotenv from 'dotenv'; 
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); //All the directories that leads to our current file, but removes file name from the path.
dotenv.config({path: path.resolve(__dirname, '../.env') }); 

mongoose.connect(process.env.URI);

const SpaceSchema = new mongoose.Schema({
    display_name: {type: String, required: true},
    name: {type: String, required: true},
    latitude: {type: Number, required: true},
    longitude: {type: Number, required: true},
    place_id: {type: Number, required: true},
    type:{type: String, required: true}, //ice_cream, park, restaurant
    lastVisited: {type: Date, default: null}, //when we create a new space, no memories, so no lastVisited date
}, {timestamps: true});

const Space = new mongoose.model("Space", SpaceSchema); 

export{
   Space
}