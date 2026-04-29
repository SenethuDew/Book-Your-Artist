  
  const handlePublish = async () => {
    if (slots.length === 0) {
      setError("Add availability slots before publishing");
      return;
    }
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) {
      setError("Not authenticated");
      return;
    }
    
    const availableCount = slots.filter((s: any) => s.status === "Available").length;
    if (!confirm(`Publish ${availableCount} available slot(s) to client search?`)) return;
    
    setError("");
    setSuccess("");
    
    try {
      for (const slot of slots.filter((s: any) => s.status === "Available")) {
        await fetch(`${API_BASE_URL}/api/availability/${slot._id}`, {
          method: "PATCH",
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ isPublished: true })
        });
      }
      
      setSuccess(`✓ Published! Your calendar is now visible in client search.`);
      fetchSlots();
    } catch (err) {
      console.error("Publish error:", err);
      setError("Failed to publish slots");
    }
  };
