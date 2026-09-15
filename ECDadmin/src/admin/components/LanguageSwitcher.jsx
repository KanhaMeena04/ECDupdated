import React from "react";

const LanguageSwitcher = ({ languages = ["English", "Arabic"], selectedLanguage, onChange }) => {
  return (
    <div className="flex gap-4 mb-4 border-b">
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => onChange(lang)}
          className={`pb-2 px-4 text-sm font-medium transition-colors ${
            selectedLanguage === lang
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-400"
          }`}
        >
          {lang === "English" ? "🌐 English" : "🌐 Arabic"}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
