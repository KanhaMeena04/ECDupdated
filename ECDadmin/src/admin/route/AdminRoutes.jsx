import { Routes, Route } from "react-router-dom";
import { lazy } from "react";
import AppLayout from "../layouts/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import AddFilterSubCategory from "../filter/pages/AddFilterSubCategory";
const Dashboard = lazy(() => import("../dashboard/Dashboard"));
const ChangePasswordForm = lazy(() => import("../pages/ChangePassword"));
const NewOrder = lazy(() => import("../orders/pages/NewOrder"));
const ProcessingOrders=lazy(()=>import("../orders/pages/ProcessingOrders"))
const PickUpOrders =lazy(()=>import("../orders/pages/PickUpOrders"))
const DeliveredOders =lazy(()=>import("../orders/pages/DeliverdOrders"))

const CancelledOrders=lazy(()=>import("../orders/pages/CancelledOrders"))
const EditCancellation=lazy(()=>import("../cancellation/pages/EditCancellation"))


const FailedOrders=lazy(()=>import('../orders/pages/FailedOrders'))
const AbandonCart = lazy(()=>import('../orders/pages/AbandonCart'))
const RefundOrders=lazy(()=>import('../orders/pages/RefundOrders'))
const OrderDashBoard=lazy(()=>import('../orders/pages/OrderDashboard'))

const ViewOrder=lazy(()=>import('../orders/pages/ViewOrder'))
const RestaurantsList =lazy(()=>import("../restaurants/pages/RestaurantsList"))
const ActiveRestaurantsList =lazy(()=>import("../restaurants/pages/ActiveRestaurantsList"))
const AddRestaurantList=lazy(()=>import("../restaurants/pages/AddRestaurantList"))
const EaglesView=lazy(()=>import("../restaurants/pages/EaglesView"))
const ApproveRestaurants=lazy(()=>import("../restaurants/pages/ApproveRestuarant"))
const EditRestaurantMenuAdmin=lazy(()=>import("../restaurants/pages/EditRestaurantMenuAdmin"))
const RestaurantDetails=lazy(()=>import("../restaurants/pages/RestaurantDetails"))

const CountryList=lazy(()=>import("../citymanagment/pages/CountryList"))
const CityList=lazy(()=>import("../citymanagment/pages/CityList"))
const StateList=lazy(()=>import("../citymanagment/pages/StateList"))
const Zones=lazy(()=>import("../citymanagment/pages/Zones"))
const VehicleList=lazy(()=>import("../vehiclemanagment/pages/VehicleList"))
const AddVehicle=lazy(()=>import("../vehiclemanagment/pages/AddVehicle"))

const BrandList =lazy(()=>import("../brands/pages/BrandsList"))
const AddBrand =lazy(()=>import("../brands/pages/AddBrands"))
const BrandSort =lazy(()=>import("../brands/pages/BrandSort"))
const EditBrand=lazy(()=>import("../brands/pages/EditBrand"))

const DriverList=lazy(()=>import("../drivermanagement/pages/DriverList"))
const AddDriver=lazy(()=>import("../drivermanagement/pages/AddDriver"))
const PromocodesList=lazy(()=>import("../promocodes/pages/PromoCodesList"))
const AddPromoCodes=lazy(()=>import("../promocodes/pages/AddPromoCodes"))
const UserManagement=lazy(()=>import("../userManagement/pages/UserManagement"))

const CategoryList=lazy(()=>import("../categories/pages/CategoryList"))
const AddCategory=lazy(()=>import("../categories/pages/AddCategory"))
const CategorySort=lazy(()=>import("../categories/pages/CategorySort"))
const EditCategory=lazy(()=>import("../categories/pages/EditCategory"))

const UnitSymbolAdd=lazy(()=>import("../units/pages/AddUnitSymbol"))
const AddUnit=lazy(()=>import("../units/pages/AddUnit"))
const UnitList=lazy(()=>import("../units/pages/UnitList"))
const UnitSymbolList=lazy(()=>import("../units/pages/UnitSymbolList"))
const CuisinesList=lazy(()=>import("../cuisines/pages/CuisinesList"))

const Addons=lazy(()=>import("../addons/pages/Addons"))
const EditAddon=lazy(()=>import("../addons/pages/EditAddon"))

const AddGroups=lazy(()=>import("../groups/pages/AddGroups"))
const AddGroupTag=lazy(()=>import("../groups/pages/AddGroupTag"))
const GroupList=lazy(()=>import("../groups/pages/GroupList"))
const GroupTagsList=lazy(()=>import("../groups/pages/GroupTagsList"))
const EditGroup=lazy(()=>import("../groups/pages/EditGroup"))
const RestaurantPayoutList=lazy(()=>import("../payout/Pages/RestaurantPayoutList"))
const RestaurantTransactionHistory=lazy(()=>import("../payout/Pages/RastaurantTransactionHistory"))
const DriverPayout=lazy(()=>import("../payout/Pages/DriverPayout"))
const DriverTransactionHistory=lazy(()=>import("../payout/Pages/DriverTransactionHistory"))
const RiderCashManagement=lazy(()=>import("../payout/Pages/RiderCashManagement"))
const AdminFinancialOverview=lazy(()=>import("../payout/Pages/AdminFinancialOverview"))
const Reviews=lazy(()=>import("../pages/Reviews"))
const FoodQuantityList=lazy(()=>import("../food/pages/FoodQuantityList"))
const AddFoodQuantity=lazy(()=>import("../food/pages/AddFoodQuantity"))
const TermsAndConditions=lazy(()=>import("../contentmanagement/pages/TermsAndConditions"))
const Contact=lazy(()=>import("../contentmanagement/pages/Contact"))
const AboutUs=lazy(()=>import("../contentmanagement/pages/AboutUs"))
const FAQ=lazy(()=>import("../contentmanagement/pages/FAQ"))
const LandingPage=lazy(()=>import("../contentmanagement/pages/LandingPage"))
const PrivacyPolicy=lazy(()=>import("../contentmanagement/pages/PrivacyPolicy"))
const UserAppCmsPage=lazy(()=>import("../contentmanagement/pages/UserAppCmsPage"))
const CatalogMasterControl=lazy(()=>import("../contentmanagement/pages/CatalogMasterControl"))
const PricingControlTower=lazy(()=>import("../contentmanagement/pages/PricingControlTower"))
const RestaurantDashboard=lazy(()=>import("../restaurants/pages/RestaurantDashboard"))
const EditRestaurant=lazy(()=>import("../restaurants/pages/EditRestaurant"))


const AddDocument =lazy(()=>import("../documentmanagement/pages/AddDoument"))
const Document =lazy(()=>import("../documentmanagement/pages/Document"))
const EditDocument=lazy(()=>import("../documentmanagement/pages/EditDocument"))

const Reason=lazy(()=>import("../cancellation/pages/CancellationReason"))
const AddReason=lazy(()=>import("../cancellation/pages/AddCancelltionReason"))
const RestaurantBanner=lazy(()=>import("../restaurantbanner/pages/RestaurantBanner"))
const AddRestaurantBanner=lazy(()=>import("../restaurantbanner/pages/AddRestaurantBanner"))


const Tags=lazy(()=>import("../tags/pages/Tags"))
const AddTags=lazy(()=>import("../tags/pages/AddTag"))
const EditTag=lazy(()=>import("../tags/pages/EditTag"))

const CreateRole=lazy(()=>import("../roles/pages/CreateRole"))
const CreateStaff=lazy(()=>import("../roles/pages/CreateStaff"))
const Role=lazy(()=>import("../roles/pages/Role"))
const Staff=lazy(()=>import("../roles/pages/Staff"))
const DeliveryReports=lazy(()=>import("../reports/pages/DeliveryPeopleReports"))
const OrderReports=lazy(()=>import("../reports/pages/OrderReports"))
const ProfitLossReports=lazy(()=>import("../reports/pages/ProfitLossReports"))
const RestaurantReports=lazy(()=>import("../reports/pages/RestaurantReports"))
const TopUserReports=lazy(()=>import("../reports/pages/TopUserReports"))
const WalletReports=lazy(()=>import("../reports/pages/WalletReports"))
const CustomPush=lazy(()=>import("../promocodes/pages/CustomPush"))
const AdminCustomPush=lazy(()=>import("../promocodes/pages/AdminCutomPush"))
const EditPromocode=lazy(()=>import("../promocodes/pages/EditPromocode"))

const FilterCategory=lazy(()=>import("../filter/pages/FilterCategoryList"))
const FilterCategorySort=lazy(()=>import("../filter/pages/FilterCategorySort"))
const FilterSubCategory=lazy(()=>import("../filter/pages/FilterSubcategory"))
const AddFilterCategory=lazy(()=>import("../filter/pages/AddFilterCategory"))
const EditFilterCategory=lazy(()=>import("../filter/pages/EditFilterCategory"))
const EditFilterSubCategory=lazy(()=>import("../filter/pages/EditFilterSubCategory"))

const Setting=lazy(()=>import("../setting/pages/Setting"))

const AddAddon=lazy(()=>import("../addons/pages/AddAddon"))

const AddCuisine=lazy(()=>import("../cuisines/pages/AddCuisine"))
const UserProfile=lazy(()=>import("../userManagement/pages/UserProfile"))
const UserOrders=lazy(()=>import("../userManagement/pages/UserOrders"))
const EditRestaurantBanner=lazy(()=>import("../restaurantbanner/pages/EditRestaurantBanner"))

const AdminCreateRestaurant=lazy(()=>import("../restaurants/pages/AdminCreateRestaurant"))
const RestaurantApplication=lazy(()=>import("../restaurants/pages/RestaurantApplication"))
const PendingRestaurants=lazy(()=>import("../restaurants/pages/PendingRestaurants"))

const AdminCreateRider=lazy(()=>import("../drivermanagement/pages/AdminCreateRider"))
const PendingDriverList=lazy(()=>import("../drivermanagement/pages/PendingDriverList"))
const DriverLiveLocation=lazy(()=>import("../drivermanagement/pages/DriverLiveLocation"))
const EditRider=lazy(()=>import("../drivermanagement/pages/EditRider"))
const DriverProfile=lazy(()=>import("../drivermanagement/pages/DriverProfile"))

const AddCity=lazy(()=>import("../citymanagment/pages/AddCity"))
const EditCity=lazy(()=>import("../citymanagment/pages/EditCity"))
const AddZone=lazy(()=>import("../citymanagment/pages/AddZone"))

const EditGroupTag=lazy(()=>import("../groups/pages/EditGroupTag"))
const EditFoodQuantity=lazy(()=>import("../food/pages/EditFoodQuantity"))


const AdminRoutes = () => {
  return (
    <Routes>

        {/* PROTECTED ROUTES */}

				 <Route
				   element={
					 <ProtectedRoute role="admin">
					   <AppLayout />
				    </ProtectedRoute>
				   }
				 >
				 <Route path="/dashboard" element={<Dashboard />} />
				 <Route path="/change-password" element={<ChangePasswordForm />} />
				 <Route path="/new-order" element={<NewOrder />} />
				 <Route path="/processing-order" element={<ProcessingOrders />} />
				 <Route path="/pick-up-order" element={<PickUpOrders />} />
				 <Route path="/delivered-order" element={<DeliveredOders />} />
				 <Route path="/cancelled-order" element={<CancelledOrders />} />
				 <Route path="/failed-order" element={<FailedOrders />} />
				 <Route path="/abandon-cart" element={<AbandonCart />} />
				 <Route path="/order-refund" element={<RefundOrders />} />
				 <Route path="/order-dashboard" element={<OrderDashBoard />} />
				 <Route path="/view-order/:id" element={<ViewOrder />} />

				 <Route path="/restaurants" element={<RestaurantsList />} />
				 <Route path="/restaurant-dashboard/:id" element={<RestaurantDashboard/>} />
				 <Route path="/edit-restaurant/:id" element={<EditRestaurant/>} />
				 <Route path="/edit-restaurant-banner/:id" element={<EditRestaurantBanner/>} />
	 
				 <Route path="/active-restaurants" element={<ActiveRestaurantsList />} />
				 <Route path="/add-restaurants" element={<AddRestaurantList />} />
				 <Route path="/eagles-view" element={<EaglesView />} />
                 <Route path="/approve-restaurant" element={<ApproveRestaurants/>} />
				 <Route path="/edit-restaurant-menu/:id" element={<EditRestaurantMenuAdmin/>} />
				 <Route path="/restaurant/:id" element={<RestaurantDetails/>} />


				 <Route path="/country-list" element={<CountryList />} />
				 <Route path="/city-list" element={<CityList />} />
				 <Route path="/state-list" element={<StateList />} />
				 <Route path="/zones" element={<Zones />} />
				 <Route path="/vehicle-list" element={<VehicleList />} />
				 <Route path="/add-vehicle" element={<AddVehicle/>} />

				 <Route path="/brands" element={<BrandList/>} />
				 <Route path="/add-brands" element={<AddBrand/>} />
				 <Route path="/sort-brands" element={<BrandSort/>} />
				 <Route path="/edit-brand/:id" element={<EditBrand/>} />


				 <Route path="/driver-list" element={<DriverList/>} />
				 <Route path="/add-driver" element={<AddDriver/>} />
				 <Route path="/admin/riders/:id" element={<DriverProfile/>} />
				 <Route path="/admin/riders/edit/:id" element={<EditRider/>} />
				 <Route path="/pending-driver-list" element={<PendingDriverList/>} />

				 <Route path="/promocodes" element={<PromocodesList/>} />
				 <Route path="/add-promocodes" element={<AddPromoCodes/>} />
			 	 <Route path="/edit-promocode/:id" element={<EditPromocode/>} />

				 <Route path="/custom-push" element={<CustomPush/>} />
				 <Route path="/admin-custom-push" element={<AdminCustomPush/>} />
				 <Route path="/user-management" element={<UserManagement/>} />

				 <Route path="/category" element={<CategoryList/>} />
				 <Route path="/add-category" element={<AddCategory/>} />
				 <Route path="/sort-category" element={<CategorySort/>} />
				 <Route path="/edit-category/:id"element={<EditCategory/>} />


				 <Route path="/unit-list" element={<UnitList/>} />
				 <Route path="/unit-symbol-list" element={<UnitSymbolList/>} />
				 <Route path="/unit-symbol" element={<UnitSymbolAdd/>} />
				 <Route path="/add-unit" element={<AddUnit/>} />
				 <Route path="/cuisine-list" element={<CuisinesList/>} />

				 <Route path="/addons" element={<Addons/>} />
				 <Route path="/edit-addon/:id" element={<EditAddon/>} />

				 <Route path="/group-list" element={<GroupList/>} />
				 <Route path="/group-tag-list" element={<GroupTagsList/>} />
				 <Route path="/add-group" element={<AddGroups/>} />
				 <Route path="/add-group-tag" element={<AddGroupTag/>} />
				 <Route path="/edit-group-tag/:id" element={<EditGroupTag/>} />
				 <Route path="/edit-group/:id" element={<EditGroup/>} />

				 <Route path="/restaurant-payout" element={<RestaurantPayoutList/>} />
				 <Route path="/restaurant-transaction-history" element={<RestaurantTransactionHistory/>} />

				 <Route path="/driver-payout" element={<DriverPayout/>} />
				 <Route path="/driver-transaction-history" element={<DriverTransactionHistory/>} />
				 <Route path="/rider-cash-management" element={<RiderCashManagement/>} />
				 <Route path="/financial-overview" element={<AdminFinancialOverview/>} />
				 <Route path="/reviews-ratings" element={<Reviews/>} />

				 <Route path="/food-quantity-list" element={<FoodQuantityList/>} />
				 <Route path="/add-food-quantity" element={<AddFoodQuantity/>} />
				 <Route path="/edit-food-quantity" element={<EditFoodQuantity/>}/>

				 
				 <Route path="/terms-condition" element={<TermsAndConditions/>} />
				 <Route path="/faq" element={<FAQ/>} />
				 <Route path="/about-us" element={<AboutUs/>} />
				 <Route path="/contact" element={<Contact/>} />
				 <Route path="/landing-page" element={<LandingPage/>} />
				 <Route path="/privacy-policy" element={<PrivacyPolicy/>} />
				 <Route path="/user-app-cms" element={<UserAppCmsPage/>} />
				 <Route path="/catalog-master-control" element={<CatalogMasterControl/>} />
				 <Route path="/pricing-control" element={<PricingControlTower/>} />

				 <Route path="/documents" element={<Document/>} />
				 <Route path="/add-document" element={<AddDocument/>} />
				 <Route path="/edit-document/:id" element={<EditDocument/>} />

				 <Route path="/cancellation-reason" element={<Reason/>} />
                <Route path="/cancellation-edit/:id" element={<EditCancellation/>}/>

				 <Route path="/add-reason" element={<AddReason/>} />
				 <Route path="/restaurant-banner" element={<RestaurantBanner/>} />
				 <Route path="/add-restaurant-banner" element={<AddRestaurantBanner/>} />

				 <Route path="/tags" element={<Tags/>} />
				 <Route path="/add-tags" element={<AddTags/>} />
				 <Route path="/edit-tag/:id" element={<EditTag/>} />


				 <Route path="/create-role" element={<CreateRole/>} />
				 <Route path="/create-staff" element={<CreateStaff/>} />
				 <Route path="/role" element={<Role/>} />
				 <Route path="/staff" element={<Staff/>} />
				 <Route path="/delivery-report" element={<DeliveryReports/>} />
				 <Route path="/restaurant-report" element={<RestaurantReports/>} />
				 <Route path="/order-report" element={<OrderReports/>} />
				 <Route path="/top-user-report" element={<TopUserReports/>} />
				 <Route path="/wallet-report" element={<WalletReports/>} />
				 <Route path="/profit-loss-report" element={<ProfitLossReports/>} />

				 <Route path="/filter-category" element={<FilterCategory/>} />
				 <Route path="/filter-category-sort" element={<FilterCategorySort/>} />
				 <Route path="/filter-sub-category" element={<FilterSubCategory/>} />
				 <Route path="/filter-add-sub-category" element={<AddFilterSubCategory/>} />
				 <Route path="/filter-add-category" element={<AddFilterCategory/>} />
				 <Route path="/filter-edit-sub-category/:id" element={<EditFilterSubCategory/>} />
				 <Route path="/filter-edit-category/:id" element={<EditFilterCategory/>} />


				 <Route path="/setting" element={<Setting/>} />

				 <Route path="/add-addon" element={<AddAddon/>} />

				 <Route path="/add-cuisine" element={<AddCuisine/>} />
				 <Route path="/user-profile/:id" element={<UserProfile/>} />
				 <Route path="/user-orders/:id" element={<UserOrders/>} />

				 <Route path="/admin-create-restaurant" element={<AdminCreateRestaurant/>} />
				 <Route path="/restaurant-application" element={<RestaurantApplication/>} />
				 <Route path="/pending-restaurants" element={<PendingRestaurants/>} />

				 <Route path="/admin-create-driver" element={<AdminCreateRider/>} />
				 <Route path="/driver-live-location/:id" element={<DriverLiveLocation/>} />


				 <Route path="/add-city" element={<AddCity/>} />
				 <Route path="/edit-city/:id" element={<EditCity/>} />
				 <Route path="/add-zone" element={<AddZone/>} />

	 
			 </Route>
    </Routes>
  );
};

export default AdminRoutes;
