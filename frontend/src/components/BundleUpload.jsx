// src/components/BundleUpload.jsx
import React, { useState } from "react";
import axios from "axios";
import { FaUpload } from "react-icons/fa";
import { BASE_URL } from "../util.js";

export default function BundleUpload({ token }) {
  const [bundleFile, setBundleFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setBundleFile(e.target.files[0]);
    setMessage("");
  };

  const handleUpload = async () => {
    if (!bundleFile) {
      setMessage("Please select a JSON bundle file first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setUploading(true);
        const jsonData = JSON.parse(event.target.result);

        const res = await axios.post(`${BASE_URL}/bundle-upload`, jsonData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setMessage(`Bundle uploaded successfully! Stored: ${res.data.stored.length} entry(s)`);
      } catch (error) {
        console.error(error);
        setMessage("Failed to upload bundle. Check console for details.");
      } finally {
        setUploading(false);
      }
    };

    reader.readAsText(bundleFile);
  };

  return (
    <div className="card">
      <h3>Bundle Upload</h3>
      <input type="file" accept=".json" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="login-button"
        style={{ marginTop: "10px" }}
      >
        {uploading ? "Uploading..." : <><FaUpload /> Upload Bundle</>}
      </button>
      {message && <p style={{ marginTop: "10px" }}>{message}</p>}
    </div>
  );
}
