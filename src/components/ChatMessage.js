import React from "react";

const ChatMessage = ({ from, text }) => {
  const isBot = from === "bot";
  return (
    <div style={{
      display: "flex",
      justifyContent: isBot ? "flex-start" : "flex-end",
      margin: "5px 0"
    }}>
      <div style={{
        maxWidth: "70%",
        padding: "10px 15px",
        borderRadius: "15px",
        backgroundColor: isBot ? "#2c3e50" : "#4CAF50",
        color: "#fff",
        animation: "fadeIn 0.3s ease-in"
      }}>
        {text}
      </div>
    </div>
  );
};

export default ChatMessage;
