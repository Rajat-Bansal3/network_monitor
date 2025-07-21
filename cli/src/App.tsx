import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";
import Scan from "./pages/scan";
import AppInfo from "./pages/device_info";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/global/ProtectedROute";
import Header from "./components/global/header";

function App() {
  return (
    <Router>
      <div className='min-h-screen bg-background  text-gray-900'>
        <Header />
        <Routes>
          <Route path='/' element={<Login />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />

          <Route
            path='/scan'
            element={
              <ProtectedRoute>
                <Scan />
              </ProtectedRoute>
            }
          />
          <Route
            path='/app-info'
            element={
              <ProtectedRoute>
                <AppInfo />
              </ProtectedRoute>
            }
          />

          <Route path='/*' element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
