import React, { useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import TextEditor from "../components/TextEditor";
import { useAboutUs } from "../../api/contentmanagement";
import toast from "react-hot-toast";

function AboutUs() {
  const {
    about,
    loading,
    error,
    fetchAboutAdmin,
    updateAbout,
  } = useAboutUs();

  useEffect(() => {
    fetchAboutAdmin();
  }, [fetchAboutAdmin]);

  const handleSave = async (content) => {
    // NO pageName nonsense — backend doesn’t need it
    await updateAbout({
      title: "About Us",
      content,
    });
    toast.success("About Us updated successfully");
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PageHeader
        title="About Us"
        breadcrumbs={[
          { label: "Contents" },
          { label: "About Us", active: true },
        ]}
      />

      {error && (
        <p className="text-red-600 mb-4">{error}</p>
      )}

      <TextEditor
        title="About Us Content"
        loading={loading}
        initialValue={about?.content || ""}
        onSave={handleSave}
      />
    </div>
  );
}

export default AboutUs;
