import React, { useState } from "react";
import HomeScreenBuilder from "./HomeScreenBuilder";
import FAQ from "./FAQ";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsAndConditions from "./TermsAndConditions";
import AboutUs from "./AboutUs";
import Contact from "./Contact";
import { Layout, Image, FileText, HelpCircle, Shield, Info, Mail } from "lucide-react";

const UserAppCmsPage = () => {
  const [activeTab, setActiveTab] = useState("home_layout");

  const tabs = [
    { id: "home_layout", label: "Home Screen Layout", icon: Layout },
    { id: "faq", label: "FAQ Builder", icon: HelpCircle },
    { id: "privacy", label: "Privacy Policy", icon: Shield },
    { id: "terms", label: "Terms & Conditions", icon: FileText },
    { id: "about", label: "About Us", icon: Info },
    { id: "contact", label: "Contact Requests", icon: Mail },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">User App CMS Control Tower</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage Customer App dynamic layout, promo banners, static legal policies, FAQs, and support content.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap ${
                isActive
                  ? "bg-[#248C70] text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div className="pt-2">
        {activeTab === "home_layout" && <HomeScreenBuilder />}
        {activeTab === "faq" && <FAQ />}
        {activeTab === "privacy" && <PrivacyPolicy />}
        {activeTab === "terms" && <TermsAndConditions />}
        {activeTab === "about" && <AboutUs />}
        {activeTab === "contact" && <Contact />}
      </div>
    </div>
  );
};

export default UserAppCmsPage;
