import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import { Calendar, ChevronLeft } from "lucide-react";
import ContentLayout from "../components/ContentLayout";

const FooterContentPage = ({ type: propType }) => {
  const { type: paramType } = useParams();
  const type = propType || paramType; // Use prop if available, else use URL param
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const url = `https://api.calvant.com/footer-service/api/footer-content/type/${type}`;
        const response = await axios.get(url);
        const data = response.data;
        
        setContent(data.content || "");
        setTitle(data.name || type.charAt(0).toUpperCase() + type.slice(1));
        
        if (data.updated_at) {
          setUpdatedAt(new Date(data.updated_at).toLocaleDateString());
        }
      } catch (error) {
        console.error("Error fetching footer content:", error);
        setTitle(type.charAt(0).toUpperCase() + type.slice(1));
        setContent("<p>Document content not available.</p>");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [type]);

  const hero = (
    <div className="post-hero-refined">
      <div className="post-hero-top">
        <button className="back-link" onClick={() => window.router.back()}>
          <ChevronLeft size={16} /> Back
        </button>
        <span className="professional-badge">Company Policy</span>
      </div>
      
      <h1 className="post-hero-title">{title}</h1>
      
      {updatedAt && (
        <div className="post-hero-meta">
          <div className="meta-item">
            <Calendar size={18} />
            <span>Last updated on {updatedAt}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ContentLayout narrow heroSection={hero}>
      {loading ? (
        <div style={{ textAlign: "center", padding: "100px 0", color: "var(--cv-text-secondary)" }}>
          Loading {title}...
        </div>
      ) : (
        <div className="professional-content" dangerouslySetInnerHTML={{ __html: content }} />
      )}
    </ContentLayout>
  );
};

export default FooterContentPage;

