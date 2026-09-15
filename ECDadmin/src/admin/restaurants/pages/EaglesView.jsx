import { Chip, Stack, Button, TextField, Box, InputAdornment } from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import EaglesViewMap from "../components/EaglesViewMap";
import PageHeader from "../../components/PageHeader";
const restaurants = [
  {
    id: 1,
    name: "Zaitoon",
    lat: 12.9898,
    lng: 80.2244,
    area: "Eagles View",
    preferred: true,
  },
  {
    id: 2,
    name: "Wangs Kitchen",
    lat: 12.9912,
    lng: 80.2261,
    area: "Eagles View",
    preferred: true,
  },
  {
    id: 3,
    name: "Other Restaurant",
    lat: 12.95,
    lng: 80.20,
    area: "Velachery",
    preferred: false,
  },
];

export default function EaglesView() {
	 const eaglesRestaurants = restaurants.filter(
    (r) => r.area === "Eagles View"
  );
  return (
 <div className="w-full  lg:mt-0 p-4 xs:p-5">
  <PageHeader
    title="Restaurant "
    breadcrumbs={[
      { label: "Restaurant List" },
      { label: "Add Restaurants", active: true }
    ]}
  />
	

	 <div className="w-full mt-20 p-4">
        <EaglesViewMap restaurants={eaglesRestaurants} />
    </div>
</div> 


  );
}

