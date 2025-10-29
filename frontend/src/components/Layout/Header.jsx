import { useEffect, useRef } from "react";
import Navbar from "../bars/Navbar";
import TopBar from "../bars/TopBar";

const Header = () => {
  const headerRef = useRef(null);

  useEffect(() => {
    const setHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty("--header-height", `${height}px`);
      }
    };

    // Set initially
    setHeaderHeight();

    // Optional: Update on resize (in case of responsive layout)
    window.addEventListener("resize", setHeaderHeight);
    return () => window.removeEventListener("resize", setHeaderHeight);
  }, []);

  return (
    <header
      ref={headerRef}
      className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50"
    >
      <TopBar />
      <Navbar />
    </header>
  );
};

export default Header;

