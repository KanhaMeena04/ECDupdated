import { Plus, Search, X } from "lucide-react";

export default function PageActionBar({
  buttonLabel = "Add",
  onButtonClick,
  showSearch = true,
  searchLabel = "Search",
  placeholder,
  searchValue = "",
  onSearchChange,
  buttonIcon: ButtonIcon = Plus,
}) {
  const displayPlaceholder = placeholder || (searchLabel && searchLabel !== "Search" ? `Search ${searchLabel}...` : "Search...");

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      
      {/* Action Button */}
      {buttonLabel ? (
        <button
          onClick={onButtonClick}
          className="bg-[#00a67e] hover:bg-[#008f6d] text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <ButtonIcon size={18} />
          <span>{buttonLabel}</span>
        </button>
      ) : <div />}

      {/* Search Bar */}
      {showSearch && (
        <div className="relative flex items-center w-full sm:w-72">
          <Search size={17} className="absolute left-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={displayPlaceholder}
            className="w-full bg-white dark:bg-white text-gray-800 dark:text-gray-800 placeholder-gray-400 pl-10 pr-9 py-2 border border-gray-300 dark:border-gray-300 rounded-full text-sm shadow-sm focus:outline-none focus:border-[#00a67e] focus:ring-2 focus:ring-[#00a67e]/20 transition-all"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              className="absolute right-3 text-gray-400 hover:text-gray-600 p-0.5 rounded-full transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
