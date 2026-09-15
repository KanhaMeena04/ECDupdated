import { Plus } from "lucide-react";

export default function PageActionBar({
  buttonLabel = "Add",
  onButtonClick,
  showSearch = true,
  searchLabel = "Search",
  searchValue = "",
  onSearchChange,
  buttonIcon: ButtonIcon = Plus,
}) {
  return (
    <div className="flex justify-between items-center mb-6">
      
      {/* Action Button */}
      <button
        onClick={onButtonClick}
        className="bg-[#00a67e] hover:bg-[#008f6d] text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
      >
        <ButtonIcon size={18} />
        {buttonLabel}
      </button>

      {/* Search */}
      {showSearch && (
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm">{searchLabel}</span>
          <div className="relative">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00a67e] text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
