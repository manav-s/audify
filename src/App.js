import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Welcome from './components/Welcome';
import Simcheck from './components/Simcheck';
import Options from './components/Options';


function App() {
  return (
    <>
    <BrowserRouter>
    <Routes>
    <Route path="/" element = {<Welcome />} />
    <Route path="/home" element={<Home/>}/>
    <Route path="/options" element={<Options/>}/>
    <Route path="/sim" element={<Simcheck/>}/>
    </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
