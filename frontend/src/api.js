const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function planTrip(payload) {
  const res = await fetch(`${API_BASE}/api/trips/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorMessage = "Request failed";
    try {
      const errorData = await res.json();
      // If validation error (400), usually object with field keys
      if (typeof errorData === "object") {
        // Create a summary message from the validation errors
        errorMessage = Object.entries(errorData)
          .map(
            ([key, value]) =>
              `${key}: ${Array.isArray(value) ? value.join(", ") : value}`,
          )
          .join(" | ");
      } else {
        errorMessage =
          errorData.detail || errorData.message || JSON.stringify(errorData);
      }
    } catch (e) {
      errorMessage = res.statusText;
    }
    throw new Error(errorMessage);
  }

  return res.json();
}
