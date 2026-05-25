import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import MultiStepFormManager from "../components/forms/MultiStepFormManager";

const addRiskStyles = `
  .addrisk-page {
    padding: 24px 32px 0 32px;
    max-width: 1120px;
    margin: 0 auto;
  }

  .addrisk-back-btn {
    position: sticky;
    top: 0;
    margin-bottom: 16px;
    padding: 10px 24px;
    border-radius: 8px;
    background: #005fcc;
    border: none;
    color: #fff;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, opacity 0.3s ease;
    z-index: 999;
  }

  .addrisk-back-btn--hidden {
    transform: translateY(-100%);
    opacity: 0;
  }

  .addrisk-back-btn--visible {
    transform: translateY(0);
    opacity: 1;
    zIndex:0;
  }

  /* Small phones */
  @media (max-width: 480px) {
    .addrisk-page {
      padding: 16px 12px 0 12px;
    }

    .addrisk-back-btn {
      width: 100%;
      margin-bottom: 12px;
      font-size: 13px;
      padding: 10px 16px;
    }
  }

  /* Tablets */
  @media (min-width: 481px) and (max-width: 768px) {
    .addrisk-page {
      padding: 20px 20px 0 20px;
    }
  }

  /* Large desktop */
  @media (min-width: 1200px) {
    .addrisk-page {
      max-width: 1280px;
    }
  }
`;

const AddRisk = () => {
  const router = useRouter();
  const pathname = usePathname();
  const focusArea = "risk";

  const [showButtons, setShowButtons] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        setShowButtons(false);
      } else {
        setShowButtons(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleSubmit = () => {
    // submission happens inside MultiStepFormManager
  };

  return (
    <div className="addrisk-page">
      {/* inject styles */}
      <style>{addRiskStyles}</style>

      <button
        className={`addrisk-back-btn ${
          showButtons ? "addrisk-back-btn--visible" : "addrisk-back-btn--hidden"
        }`}
        onClick={() => router.push("/risk-assessment")}
      >
        ← Back to Dashboard
      </button>

      <MultiStepFormManager onSubmit={handleSubmit} focusArea={focusArea} />
    </div>
  );
};

export default AddRisk;

