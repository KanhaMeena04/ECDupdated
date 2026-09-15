import React, { useState } from 'react';
import { LuPencilLine, LuTrash2 } from "react-icons/lu";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { UnfoldMoreOutlined } from '@mui/icons-material'; // For the sort icon

const RoleListTable = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const roles = [
    { id: 1, name: 'Admin Role', type: 'Admin' },
    { id: 2, name: 'Res Role', type: 'Restaurant Admin' },
    { id: 3, name: 'Store Admin', type: 'Restaurant Admin' },
    { id: 4, name: 'Agent1', type: 'Admin' },
    { id: 5, name: 'test', type: 'Restaurant Admin' },
    { id: 6, name: 'Lokesh-test', type: 'Restaurant Admin' },
    { id: 7, name: 'Super Admin', type: 'Admin' },
    { id: 8, name: 'john', type: 'Admin' },
  ];

  return (
    <div className="w-full font-sans p-4 bg-white rounded-md shadow-sm border border-gray-100">
      
      {/* Top Search Bar */}
      <div className="flex justify-end items-center mb-4 gap-2">
        <label className="text-sm text-gray-500">Search</label>
        <input
          type="text"
          className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-teal-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border border-gray-200 rounded">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-gray-200 text-[#495057] text-sm">
              <th className="py-3 px-4 w-12 border-r border-gray-200 text-center font-bold">#</th>
              <th className="py-3 px-4 border-r border-gray-200 font-bold group cursor-pointer">
                <div className="flex justify-between items-center text-[#4b49ac]">
                  Role Name 
                  <UnfoldMoreOutlined className="text-gray-300 group-hover:text-gray-500" style={{ fontSize: 16 }} />
                </div>
              </th>
              <th className="py-3 px-4 border-r border-gray-200 font-bold group cursor-pointer">
                <div className="flex justify-between items-center text-[#4b49ac]">
                  Account Type 
                  <UnfoldMoreOutlined className="text-gray-300 group-hover:text-gray-500" style={{ fontSize: 16 }} />
                </div>
              </th>
              <th className="py-3 px-4 font-bold group cursor-pointer">
                <div className="flex justify-between items-center text-[#4b49ac]">
                  Action 
                  <UnfoldMoreOutlined className="text-gray-300 group-hover:text-gray-500" style={{ fontSize: 16 }} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-600">
            {roles.map((role) => (
              <tr key={role.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4 border-r border-gray-200 text-center font-bold">{role.id}</td>
                <td className="py-3 px-4 border-r border-gray-200">{role.name}</td>
                <td className="py-3 px-4 border-r border-gray-200">{role.type}</td>
                <td className="py-3 px-4">
                  <div className="flex justify-center items-center gap-4">
                    <button className="text-gray-600 hover:text-blue-600">
                      <LuPencilLine size={18} />
                    </button>
                    <button className="text-gray-600 hover:text-red-600">
                      <LuTrash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-[13px] text-gray-500">
        <div className="flex items-center gap-1">
          Showing 1 to 
          <select className="mx-1 border border-gray-300 rounded p-1 outline-none bg-white">
            <option>10</option>
            <option>25</option>
            <option>50</option>
          </select>
          of 8 entries
        </div>

        <div className="flex items-center gap-0 mt-4 md:mt-0">
          <button className="p-2 text-gray-300 cursor-not-allowed border border-gray-200 rounded-l-md">
            <HiChevronLeft size={18} />
          </button>
          <button className="w-9 h-9 flex items-center justify-center bg-[#00a684] text-white font-medium">
            1
          </button>
          <button className="p-2 text-gray-300 cursor-not-allowed border border-gray-200 rounded-r-md">
            <HiChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleListTable;