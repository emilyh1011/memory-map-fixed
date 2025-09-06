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

const MemorySchema = new mongoose.Schema({
    title: {type: String, required: true},
    feeling: {type: String, required: true},
    memoryDate: {type: Date, required: true},
    description: {type: String, required: true},
    images: {type: Array},
    spaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Space", required: true } // Reference the _id field of its corresponding Space document
});

const Memory = new mongoose.model("Memory", MemorySchema);

export{
   Space, Memory
}