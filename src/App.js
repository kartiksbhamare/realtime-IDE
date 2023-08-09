import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import EditorPage from './pages/EditorPage';

function App() {
  return (
    <>
      <div>
        <Toaster
          position="top-right"
          toastOptions={{
            success: {
              theme: {
                primary: '#4aed88',
              },
            },
          }}
        ></Toaster>
      </div>
      <Router>
        <Routes>

          <Route path="/" element={<Home />} />
          <Route
            path="/editor/:roomId"
            element={<EditorPage />}
          />

        </Routes>
      </Router>
    </>
  );
}

export default App;