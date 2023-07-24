
// Get the indices of the facets that share the same vertex
export function getSameVertexIndices(indices, positions) {
  const sharedIndices = Array.from({ length: indices.length }, () => []);

  for (let i = 0; i < indices.length; i++) {
    for (let j = 0; j < indices.length; j++) {
      if (
        positions[3 * indices[i] + 0] === positions[3 * indices[j] + 0] &&
        positions[3 * indices[i] + 1] === positions[3 * indices[j] + 1] &&
        positions[3 * indices[i] + 2] === positions[3 * indices[j] + 2]
      ) {
        sharedIndices[indices[i]].push(indices[j]);
      }
    }
  }

  return sharedIndices;
}

// Reset Button
const ResetButton = ({ onClick }) => {
    return (
      <button
        style={{
          width: "120px",
          height: "50px",
          borderRadius: "10px",
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: "20px",
          backgroundColor: "#007bff",
          color: "#fff",
          fontSize: "18px",
          cursor: "pointer",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
          border: "none",
          outline: "none",
        }}
        onClick={onClick}
      >
        RESET
      </button>
    );
  };
  
  export default ResetButton;
  