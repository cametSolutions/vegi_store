import { Outlet } from "react-router-dom";
import Header from "./Header";
import CustomBarLoader from "../loaders/CustomBarLoader";
import { useSelector } from "react-redux";

function MainLayout() {
  const isLoading = useSelector((state) => state.isLoading);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex flex-col">
      <Header />
      {
        /* Show loader when isLoading is true */
        isLoading && <CustomBarLoader />
      }
      <main className="relative flex-1 flex max-w-screen overflow-x-hidden bg-[#e9f5eb]">
        <div
          className="absolute inset-0 bg-center bg-no-repeat bg-[length:500px] opacity-10"
          style={{ backgroundImage: `url('/images/background2.png')` }}
        />
        <div className="relative z-10 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
