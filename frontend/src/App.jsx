import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

import MainLayout from "./components/Layout/MainLayout";
import AuthLayout from "./components/Layout/AuthLayout";
import MastersRoutes from "./routes/MastersRoutes";
import CustomMoonLoader from "./components/loaders/CustomMoonLoader";
import NotFoundPage from "./components/errors/NotFoundPage";
import ProtectedRoute from "./components/Layout/ProtectedRoute";

const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/home/Home"));

function App() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            backgroundColor: "#f0f2f5",
          }}
        >
          <CustomMoonLoader />
        </div>
      }
    >
      <Routes>
        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Main */}
        <Route element={<MainLayout />}>
          <Route path="/" element={ <ProtectedRoute><Home/></ProtectedRoute> } />
          <Route path="/home-page" element={<ProtectedRoute><Home/></ProtectedRoute>} />

          {MastersRoutes()}

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
