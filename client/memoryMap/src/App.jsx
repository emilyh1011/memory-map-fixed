import { useState } from 'react';

import { Routes, Route } from 'react-router-dom';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import Map from '../pages/Map';

function App() {


  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Routes>
          <Route path="/" element={<Map />}></Route>
        </Routes>

      </LocalizationProvider>

    </>

  )
}

export default App
