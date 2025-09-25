import { Outlet } from "react-router-dom";
import Header from "./Header";
import CustomBarLoader from "../loaders/CustomBarLoader";
import { useSelector } from "react-redux";
import NoCompanyDataWrapper from "../errors/NoCompanyDataErrorPage";
import NoCompanyDataErrorPage from "../errors/NoCompanyDataErrorPage";

function MainLayout() {
  const isLoading = useSelector((state) => state.loader.isLoading);

  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex flex-col">
      <Header />

      {
        /* Show loader when isLoading is true */
        isLoading && <CustomBarLoader />
      }
      <main
        className={` ${
          isLoading ? "opacity-50 pointer-events-none" : ""
        }   relative flex-1 flex max-w-screen overflow-x-hidden bg-[#e9f5eb]`}
      >
        {}
        <div
          className="absolute inset-0 bg-center bg-no-repeat bg-[length:500px] opacity-10"
          style={{ backgroundImage: `url('/images/background2.png')` }}
        />

        <div className="relative z-10 w-full">
          {!selectedCompanyFromStore || !selectedBranchFromStore ? (
            <NoCompanyDataErrorPage />
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
