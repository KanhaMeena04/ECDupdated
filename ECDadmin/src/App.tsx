import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./admin/context/AuthContext";
import "./App.css";
import {Toaster} from "react-hot-toast"
import AppRoutes from "./routes/AppRoutes";
// const Dashboard = lazy(() => import("./dashboard/Dashboard"));
// const AdminLogin = lazy(() => import("./admin/pages/AdminLogin"));
// const ChangePasswordForm = lazy(() => import("./admin/pages/ChangePassword"));
// const NewOrder = lazy(() => import("./orders/pages/NewOrder"));
// const ProcessingOrders=lazy(()=>import("./orders/pages/ProcessingOrders"))
// const PickUpOrders =lazy(()=>import("./orders/pages/PickUpOrders"))
// const DeliveredOders =lazy(()=>import("./orders/pages/DeliverdOrders"))
// const CancelledOrders=lazy(()=>import("./orders/pages/CancelledOrders"))
// const FailedOrders=lazy(()=>import('./orders/pages/FailedOrders'))
// const AbandonCart = lazy(()=>import('./orders/pages/AbandonCart'))
// const RefundOrders=lazy(()=>import('./orders/pages/RefundOrders'))
// const OrderDashBoard=lazy(()=>import('./orders/pages/OrderDashboard'))
// const ViewOrder=lazy(()=>import('./orders/pages/ViewOrder'))
// const RestaurantsList =lazy(()=>import("./restaurants/pages/RestaurantsList"))
// const ActiveRestaurantsList =lazy(()=>import("./restaurants/pages/ActiveRestaurantsList"))
// const AddRestaurantList=lazy(()=>import("./restaurants/pages/AddRestaurantList"))
// const EaglesView=lazy(()=>import("./restaurants/pages/EaglesView"))
// const CountryList=lazy(()=>import("./citymanagment/pages/CountryList"))
// const CityList=lazy(()=>import("./citymanagment/pages/CityList"))
// const StateList=lazy(()=>import("./citymanagment/pages/StateList"))
// const Zones=lazy(()=>import("./citymanagment/pages/Zones"))
// const VehicleList=lazy(()=>import("./vehiclemanagment/pages/VehicleList"))
// const AddVehicle=lazy(()=>import("./vehiclemanagment/pages/AddVehicle"))
// const BrandList =lazy(()=>import("./brands/BrandsList"))
// const AddBrand =lazy(()=>import("./brands/AddBrands"))
// const BrandSort =lazy(()=>import("./brands/BrandSort"))
// const DriverList=lazy(()=>import("./drivermanagement/pages/DriverList"))
// const AddDriver=lazy(()=>import("./drivermanagement/pages/AddDriver"))
// const PendingDriverList=lazy(()=>import("./drivermanagement/pages/PendingDriverList"))
// const PromocodesList=lazy(()=>import("./promocodes/pages/PromoCodesList"))
// const AddPromoCodes=lazy(()=>import("./promocodes/pages/AddPromoCodes"))
// const UserManagement=lazy(()=>import("./admin/pages/UserManagement"))
// const CategoryList=lazy(()=>import("./categories/pages/CategoryList"))
// const AddCategory=lazy(()=>import("./categories/pages/AddCategory"))
// const CategorySort=lazy(()=>import("./categories/pages/CategorySort"))
// const UnitSymbolAdd=lazy(()=>import("./units/pages/AddUnitSymbol"))
// const AddUnit=lazy(()=>import("./units/pages/AddUnit"))
// const UnitList=lazy(()=>import("./units/pages/UnitList"))
// const UnitSymbolList=lazy(()=>import("./units/pages/UnitSymbolList"))
// const CuisinesList=lazy(()=>import("./admin/pages/CuisinesList"))
// const Addons=lazy(()=>import("./admin/pages/Addons"))
// const AddGroups=lazy(()=>import("./groups/pages/AddGroups"))
// const AddGroupTag=lazy(()=>import("./groups/pages/AddGroupTag"))
// const GroupList=lazy(()=>import("./groups/pages/GroupList"))
// const GroupTagsList=lazy(()=>import("./groups/pages/GroupTagsList"))
// const RestaurantPayoutList=lazy(()=>import("./payout/Pages/RestaurantPayoutList"))
// const RestaurantTransactionHistory=lazy(()=>import("./payout/Pages/RastaurantTransactionHistory"))
// const DriverPayout=lazy(()=>import("./payout/Pages/DriverPayout"))
// const DriverTransactionHistory=lazy(()=>import("./payout/Pages/DriverTransactionHistory"))
// const Reviews=lazy(()=>import("./admin/pages/Reviews"))
// const FoodQuantityList=lazy(()=>import("./food/pages/FoodQuantityList"))
// const AddFoodQuantity=lazy(()=>import("./food/pages/AddFoodQuantity"))
// const TermsAndConditions=lazy(()=>import("./contentmanagement/pages/TermsAndConditions"))
// const Contact=lazy(()=>import("./contentmanagement/pages/Contact"))
// const AboutUs=lazy(()=>import("./contentmanagement/pages/AboutUs"))
// const FAQ=lazy(()=>import("./contentmanagement/pages/FAQ"))
// const LandingPage=lazy(()=>import("./contentmanagement/pages/LandingPage"))
// const PrivacyPolicy=lazy(()=>import("./contentmanagement/pages/PrivacyPolicy"))
// const RestaurantDashboard=lazy(()=>import("./restaurants/pages/RestaurantDashboard"))
// const EditRestaurant=lazy(()=>import("./restaurants/pages/EditRestaurant"))
// const AddDocument =lazy(()=>import("./documentmanagement/pages/AddDoument"))
// const Document =lazy(()=>import("./documentmanagement/pages/Document"))
// const Reason=lazy(()=>import("./cancellation/pages/CancellationReason"))
// const AddReason=lazy(()=>import("./cancellation/pages/AddCancelltionReason"))
// const RestaurantBanner=lazy(()=>import("./restaurantbanner/pages/RestaurantBanner"))
// const AddRestaurantBanner=lazy(()=>import("./restaurantbanner/pages/AddRestaurantBanner"))
// const Tags=lazy(()=>import("./tags/pages/Tags"))
// const AddTags=lazy(()=>import("./tags/pages/AddTag"))
// const CreateRole=lazy(()=>import("./roles/pages/CreateRole"))
// const CreateStaff=lazy(()=>import("./roles/pages/CreateStaff"))
// const Role=lazy(()=>import("./roles/pages/Role"))
// const Staff=lazy(()=>import("./roles/pages/Staff"))
// const DeliveryReports=lazy(()=>import("./reports/pages/DeliveryPeopleReports"))
// const OrderReports=lazy(()=>import("./reports/pages/OrderReports"))
// const ProfitLossReports=lazy(()=>import("./reports/pages/ProfitLossReports"))
// const RestaurantReports=lazy(()=>import("./reports/pages/RestaurantReports"))
// const TopUserReports=lazy(()=>import("./reports/pages/TopUserReports"))
// const WalletReports=lazy(()=>import("./reports/pages/WalletReports"))
// const CustomPush=lazy(()=>import("./promocodes/pages/CustomPush"))
// const AdminCustomPush=lazy(()=>import("./promocodes/pages/AdminCutomPush"))
// const FilterCategory=lazy(()=>import("./filter/pages/FilterCategoryList"))
// const FilterCategorySort=lazy(()=>import("./filter/pages/FilterCategorySort"))
// const FilterSubCategory=lazy(()=>import("./filter/pages/FilterSubcategory"))
// const Setting=lazy(()=>import("./setting/pages/Setting"))
function App() {

  return (
    <Router>
      <Toaster/>
       <AuthProvider>
        <Suspense
          fallback={
            <div className="p-6 text-gray-500 text-sm">
              Loading page...
            </div>
          }
        >
            <AppRoutes />
          <Routes>
            {/* <Route path="/" element={<AdminLogin />} /> */}

      
        </Routes>
      </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;


    //  <Route
    //           element={
    //             <ProtectedRoute>
    //               <AppLayout />
    //             </ProtectedRoute>
    //           }
    //         >
    //         <Route path="/dashboard" element={<Dashboard />} />
    //         <Route path="/change-password" element={<ChangePasswordForm />} />
    //         <Route path="/new-order" element={<NewOrder />} />
    //         <Route path="/processing-order" element={<ProcessingOrders />} />
    //         <Route path="/pick-up-order" element={<PickUpOrders />} />
    //         <Route path="/delivered-order" element={<DeliveredOders />} />
    //         <Route path="/cancelled-order" element={<CancelledOrders />} />
    //         <Route path="/failed-order" element={<FailedOrders />} />
    //         <Route path="/abandon-cart" element={<AbandonCart />} />
    //         <Route path="/order-refund" element={<RefundOrders />} />
    //         <Route path="/order-dashboard" element={<OrderDashBoard />} />
    //         <Route path="/view-order/:id" element={<ViewOrder />} />
    //         <Route path="/restaurants" element={<RestaurantsList />} />
    //         <Route path="/restaurant-dashboard/:id" element={<RestaurantDashboard/>} />
    //         <Route path="/edit-restaurant/:id" element={<EditRestaurant/>} />

    //         <Route path="/active-restaurants" element={<ActiveRestaurantsList />} />
    //         <Route path="/add-restaurants" element={<AddRestaurantList />} />
    //         <Route path="/eagles-view" element={<EaglesView />} />
    //         <Route path="/country-list" element={<CountryList />} />
    //         <Route path="/city-list" element={<CityList />} />
    //         <Route path="/state-list" element={<StateList />} />
    //         <Route path="/zones" element={<Zones />} />
    //         <Route path="/vehicle-list" element={<VehicleList />} />
    //         <Route path="/add-vehicle" element={<AddVehicle/>} />
    //         <Route path="/brands" element={<BrandList/>} />
    //         <Route path="/add-brands" element={<AddBrand/>} />
    //         <Route path="/sort-brands" element={<BrandSort/>} />
    //         <Route path="/driver-list" element={<DriverList/>} />
    //         <Route path="/add-driver" element={<AddDriver/>} />
    //         <Route path="/pending-driver-list" element={<PendingDriverList/>} />
    //         <Route path="/promocodes" element={<PromocodesList/>} />
    //         <Route path="/add-promocodes" element={<AddPromoCodes/>} />
    //         <Route path="/custom-push" element={<CustomPush/>} />
    //         <Route path="/admin-custom-push" element={<AdminCustomPush/>} />
    //         <Route path="/user-management" element={<UserManagement/>} />
    //         <Route path="/category" element={<CategoryList/>} />
    //         <Route path="/add-category" element={<AddCategory/>} />
    //         <Route path="/sort-category" element={<CategorySort/>} />
    //         <Route path="/unit-list" element={<UnitList/>} />
    //         <Route path="/unit-symbol-list" element={<UnitSymbolList/>} />
    //         <Route path="/unit-symbol" element={<UnitSymbolAdd/>} />
    //         <Route path="/add-unit" element={<AddUnit/>} />
    //         <Route path="/cuisine-list" element={<CuisinesList/>} />
    //         <Route path="/addons" element={<Addons/>} />
    //         <Route path="/group-list" element={<GroupList/>} />
    //         <Route path="/group-tag-list" element={<GroupTagsList/>} />
    //         <Route path="/add-group-tag" element={<AddGroupTag/>} />
    //         <Route path="/add-group-list" element={<AddGroups/>} />
    //         <Route path="/restaurant-payout" element={<RestaurantPayoutList/>} />
    //         <Route path="/restaurant-transaction-history" element={<RestaurantTransactionHistory/>} />
    //         <Route path="/driver-payout" element={<DriverPayout/>} />
    //         <Route path="/driver-transaction-history" element={<DriverTransactionHistory/>} />
    //         <Route path="/reviews-ratings" element={<Reviews/>} />
    //         <Route path="/food-quantity-list" element={<FoodQuantityList/>} />
    //         <Route path="/add-food-quantity" element={<AddFoodQuantity/>} />
    //         <Route path="/terms-condition" element={<TermsAndConditions/>} />
    //         <Route path="/faq" element={<FAQ/>} />
    //         <Route path="/about-us" element={<AboutUs/>} />
    //         <Route path="/contact" element={<Contact/>} />
    //         <Route path="/landing-page" element={<LandingPage/>} />
    //         <Route path="/privacy-policy" element={<PrivacyPolicy/>} />
    //         <Route path="/documents" element={<Document/>} />
    //         <Route path="/add-document" element={<AddDocument/>} />
    //         <Route path="/cancellation-reason" element={<Reason/>} />
    //         <Route path="/add-reason" element={<AddReason/>} />
    //         <Route path="/restaurant-banner" element={<RestaurantBanner/>} />
    //         <Route path="/add-restaurant-banner" element={<AddRestaurantBanner/>} />
    //         <Route path="/tags" element={<Tags/>} />
    //         <Route path="/add-tags" element={<AddTags/>} />
    //         <Route path="/create-role" element={<CreateRole/>} />
    //         <Route path="/create-staff" element={<CreateStaff/>} />
    //         <Route path="/role" element={<Role/>} />
    //         <Route path="/staff" element={<Staff/>} />
    //         <Route path="/delivery-report" element={<DeliveryReports/>} />
    //         <Route path="/restaurant-report" element={<RestaurantReports/>} />
    //         <Route path="/order-report" element={<OrderReports/>} />
    //         <Route path="/top-user-report" element={<TopUserReports/>} />
    //         <Route path="/wallet-report" element={<WalletReports/>} />
    //         <Route path="/profit-loss-report" element={<ProfitLossReports/>} />
    //         <Route path="/filter-category" element={<FilterCategory/>} />
    //         <Route path="/filter-category-sort" element={<FilterCategorySort/>} />
    //         <Route path="/filter-sub-category" element={<FilterSubCategory/>} />
    //         <Route path="/setting" element={<Setting/>} />

    //     </Route>
      