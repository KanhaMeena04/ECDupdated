import React from 'react';
import { Edit2, ChevronLeft, ChevronRight } from 'lucide-react'; // Optional: for icons

const StaffTable = () => {
  const staffData = [
    { id: 1, name: "Salem RR -ECR", restaurant: "", roleName: "Admin Role", roleType: "Admin" },
    { id: 2, name: "masteradmin", restaurant: "", roleName: "Admin Role", roleType: "Admin" },
    { id: 3, name: "rajeshben", restaurant: "", roleName: "Admin Role", roleType: "Admin" },
    // ... add more entries as needed
    { id: 10, name: "test", restaurant: "", roleName: "Res Role", roleType: "Restaurant Admin" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-md shadow-sm border border-gray-200">
        
        {/* Search Bar Area */}
        <div className="flex justify-end p-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Search</label>
            <input 
              type="text" 
              className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-gray-200 text-gray-600 text-sm">
                <th className="p-3 font-semibold border-r w-12 text-center">#</th>
                <th className="p-3 font-semibold border-r">Name</th>
                <th className="p-3 font-semibold border-r">Restaurant</th>
                <th className="p-3 font-semibold border-r">Role Name</th>
                <th className="p-3 font-semibold border-r">Role Type</th>
                <th className="p-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {staffData.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 border-r text-center">{item.id}</td>
                  <td className="p-3 border-r">{item.name}</td>
                  <td className="p-3 border-r">{item.restaurant}</td>
                  <td className="p-3 border-r">{item.roleName}</td>
                  <td className="p-3 border-r">{item.roleType}</td>
                  <td className="p-3">
                    <button className="p-1 border border-gray-300 rounded hover:bg-gray-100">
                      <Edit2 size={16} className="text-gray-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-4">
          <div className="text-xs text-gray-500">
            Showing 1 to 10 of 17 entries
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <ChevronLeft size={18} />
            </button>
            <button className="px-3 py-1 bg-emerald-500 text-white rounded-full text-sm">1</button>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-full text-sm">2</button>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffTable;