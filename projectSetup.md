1. After cloning new github repository, create client and server directories.
2. In client(our frontend), create a React-Vite app
    cd client
    npm create vite@latest memoryMap
    npm install //install dependencies in same client folder
3. Remember commands:
    - Start frontend development server(accidentally made another level of depth for client directory): 
        - cd client/memorymap 
        - npm run dev
    - Start backend server
        - cd server
        - node app.mjs

4. In client/memoryMap folder, install react-router-dom
    - npm install react-router-dom
5. In server folder, initialize a Node.js project, express, mongoose, dotenv, nodemon
    - npm init -y
    - npm install express mongoose cors dotenv nodemon
6. In server folder, create an entry point: app.mjs file
    - Entrypoint starter code:

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from "dotenv"
import path from 'path'
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url); //import.meta.url: gets the file URL(prefixes full file path with file://).  
                                                   //Use fileURLToPath to remove it. Converts that URL into a normal absolute file path
const __dirname = path.dirname(__filename); // Gives you all the directories in the file path containing current file path. 
                                            // Basically: just removes the filename from the path.
//console.log(__filename); // /Users/emilyhan/memory-map-fixed/server/app.mjs
//console.log(__dirname); // /Users/emilyhan/memory-map-fixed/server
dotenv.config({path: path.resolve(__dirname, '../.env') }); //Load .env file. Ensure file path is correct for loading .env file. 
                                                            // Current __dirname ends at "server," but must go up a level with ".." because 
                                                            // .env is in root.
                                                            //Use path.resolve() to normalize the path with ".." so it becomes correct 
                                                            // "/Users/emilyhan/memory-map-fixed/.env"

app.use(cors());

//body parsing middleware for urlencoded bodies, places parsed body into req.body
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

console.log(process.env.PORT);
//Right now, while we are developing, start server at port 3000
app.listen(process.env.PORT || 3001);

7. Setup nodemon for starting server: In the server/package.json, add this line in scripts:
    - "start": "nodemon app.mjs"

-------------MERN SETUP NOW DONE------------
8. In client folder, install leaflet and react-leaflet
    - cd client/memoryMapFolder
    - npm install leaflet
    - npm install react-leaflet

9. In client folder, create a pages folder. This will store all our page components.
10. In pages folder, create Map.jsx
11. Establish your routes(may add more pages in future).
- 11a. In src/App.jsx, we want the Map.jsx to be the opening page, so establish it as your root page.
    - App.jsx starter code:

import { useState } from 'react';
import './App.css';
import {Routes, Route} from 'react-router-dom';

import Map from '../pages/Map';

function App() {
  

  return (
    <>
      <Routes>
        <Route path = "/" element = {<Map/>}></Route>
      </Routes>
    </>
    
  )
}

export default App

- 11b. In main.jsx, wrap your App with <BrowserRouter>(Routes only works with a router)
    - main.jsx starter code:

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <StrictMode>
      <App />
    </StrictMode>,
  </BrowserRouter>
)


    