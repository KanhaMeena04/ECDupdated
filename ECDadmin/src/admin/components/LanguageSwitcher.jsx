import React from "react";

const LanguageSwitcher = ({ languages = ["English"], selectedLanguage = "English", onChange }) => {
  return (
    <div className="flex gap-4 mb-4 border-b">
      <div className="pb-2 px-4 text-sm font-medium text-teal-600 border-b-2 border-teal-600 flex items-center gap-1">
        🌐 English
      </div>
    </div>
  );
};

export default LanguageSwitcher;

