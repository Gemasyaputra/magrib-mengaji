"use client";

import { useState } from "react";
import ParentViewPage from "@/components/pages/ParentViewPage";
import SantriHistoryPage from "@/components/pages/SantriHistoryPage";
import { useRouter } from "next/navigation";

interface Props {
  studentId: string;
}

export default function LaporanClient({ studentId }: Props) {
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState("parent-view");

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const renderContent = () => {
    if (currentPath.startsWith("santri-history")) {
      let idStr = studentId;
      let modeStr = "learning";
      let returnPathStr = "parent-view";

      try {
        const urlParams = new URLSearchParams(currentPath.split("?")[1] || "");
        idStr = urlParams.get("id") || studentId;
        modeStr = urlParams.get("mode") || "learning";
        returnPathStr = urlParams.get("returnPath") || "parent-view";
      } catch (e) {
        console.error("Error parsing params", e);
      }

      return (
        <SantriHistoryPage
          santriId={idStr}
          mode={modeStr}
          returnPath={returnPathStr}
          onNavigate={handleNavigate}
        />
      );
    }

    return (
      <ParentViewPage
        studentId={studentId}
        onBack={() => {
          if (currentPath !== "parent-view") {
            setCurrentPath("parent-view");
          } else {
            router.back();
          }
        }}
        onNavigate={handleNavigate}
      />
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50">
      {renderContent()}
    </div>
  );
}
