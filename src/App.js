import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Welcome from './components/Welcome';
import ErrorDialog from './components/ErrorDialog';
import InfoDialog from './components/InfoDialog';
import LoadingOverlay from './components/LoadingOverlay';
import OptimizedPlaylist from './components/OptimizedPlaylist';
import PlaylistForm from './components/PlaylistForm';

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
