import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from "dotenv"
import path from 'path'
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 
dotenv.config({path: path.resolve(__dirname, '../.env') }); 
//app.use(express.static(path.join(__dirname, 'src')));

app.use(cors());

//body parsing middleware for urlencoded bodies, places parsed body into req.body
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

console.log(process.env.PORT);
//Right now, while we are developing, start server at port 3000
app.listen(process.env.PORT || 3001);