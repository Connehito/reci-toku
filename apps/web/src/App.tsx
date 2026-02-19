import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import History from './pages/History';
import Receipt from './pages/Receipt';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/history" element={<History />} />
      <Route path="/receipt/:id" element={<Receipt />} />
    </Routes>
  );
}

export default App;
