import PageActionBar from "../../components/PageActionBar";
import PageHeader from "../../components/PageHeader";
export default function AddDriver() {
  return (
    <div className="bg-white rounded-lg p-6 border">
			  <PageHeader
									title="Add Driver "
									breadcrumbs={[
									  { label: "Add Driver " },
									  { label: "Driver", active: true }
									]}
									/>
					  <PageActionBar
				   actionLabel="Add Driver"
				 //   onActionClick={handleAddCategory}
				   searchLabel="search"
				 //   searchValue={query}
				 //   onSearchChange={setQuery}
				 />
		
		
      {/* Stepper */}
      <div className="flex items-center gap-6 mb-6">
        <Step active step={1} label="Driver Details" />
        <Step step={2} label="Document Settings" />
        <Step step={3} label="Bank Details" />
      </div>

     
      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Select label="Restaurant (Optional)" placeholder="Select Restaurants" />
        <Select label="Vehicle Name*" placeholder="Select Vehicle" />

        <Input label="Driver Name*" placeholder="Name" />
        <PhoneInput />
        <Input label="Email*" placeholder="john.doe@email.com" />

        <Input label="Address Line1*" placeholder="Enter Address" />
        <Input label="Address Line2" placeholder="Enter Address" />
        <Select label="Select Country*" placeholder="Select Country" />

        <Select label="Select State/Province*" placeholder="Select State/Province" />
        <Select label="Select City*" placeholder="Select City" />
        <Input label="ZipCode*" placeholder="Enter Zip Code" />

        <Select label="Work City" placeholder="Select City" />
        <Select label="Work Zones" placeholder="Select Zones" />

        {/* Avatar */}
        <div>
          <label className="text-sm font-medium text-gray-600">Avatar*</label>
          <div className="border rounded-md p-2 flex justify-between items-center mt-1">
            <span className="text-gray-400 text-sm">
              Choose a file or drop it here...
            </span>
            <button className="border px-3 py-1 rounded text-sm">
              Browse
            </button>
          </div>

          <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center mt-3 text-gray-400">
            🖼️
          </div>
        </div>

        {/* Security */}
        <Input label="Password" placeholder="Enter Password" type="password" />
        <Input label="Confirm Password" placeholder="Re-type Password" type="password" />
        <Select label="Status*" placeholder="Select Status" />
      </div>

      {/* Footer */}
      <div className="flex justify-end mt-6">
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-md font-medium">
          Next →
        </button>
      </div>
    </div>
  );
}

/* ---------------- Components ---------------- */

function Step({ step, label, active }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-md flex items-center justify-center text-sm font-medium
        ${active ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"}`}
      >
        {step}
      </div>
      <span
        className={`text-sm ${
          active ? "text-emerald-600 font-medium" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function Input({ label, placeholder, type = "text" }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full border rounded-md px-3 py-2 mt-1 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
      />
    </div>
  );
}

function Select({ label, placeholder }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <select className="w-full border rounded-md px-3 py-2 mt-1 text-sm text-gray-500">
        <option>{placeholder}</option>
      </select>
    </div>
  );
}

function PhoneInput() {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600">Phone No*</label>
      <div className="flex border rounded-md mt-1 overflow-hidden">
        <select className="px-2 border-r bg-gray-50 text-sm">
          <option>🇮🇳 +91</option>
        </select>
        <input
          placeholder="Phone number"
          className="flex-1 px-3 py-2 text-sm outline-none"
        />
      </div>
      <p className="text-xs text-red-500 mt-1">
        The number field is required
      </p>
    </div>
  );
}
