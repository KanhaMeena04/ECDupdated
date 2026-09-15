import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";

export default function PageHeader({ title, breadcrumbs = [] }) {
  return (
    /* Change 1: Use flex-col (stacked) by default, 
       md:flex-row (side-by-side) for medium screens and up.
       Change 2: justify-between keeps the breadcrumbs on the right on desktop.
    */
    <div className="mb-6 mt-5 md:mt-4 flex flex-col md:flex-row md:items-center md:justify-start gap-2">
      
      <h1 className="text-2xl font-semibold text-gray-800">
        {title}
      </h1>

      {/* Change 3: Added flex-wrap so long breadcrumbs don't break the layout on tiny screens.
         Removed ml-1 to let the gap handle spacing.
      */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <HomeOutlinedIcon
          fontSize="small"
          className="text-green-600 cursor-pointer"
        />

        {breadcrumbs.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-gray-400">›</span>

            <span
              className={
                item.active
                  ? "text-gray-400"
                  : "text-green-600 cursor-pointer hover:underline"
              }
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}