import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Welcome from './components/Welcome';

function App() {
  return (
    <>
    <BrowserRouter>
    <Routes>
    <Route path="/" element = {<Welcome />} />
    <Route path="/home" element={<Home/>}/>
    </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
