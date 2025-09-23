import Navbar from "../bars/Navbar";
import TopBar from "../bars/TopBar";

const Header = () => {
  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50 ">
      <TopBar />
      <Navbar />
    </header>
  );
};

export default Header;
