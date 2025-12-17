import React from "react";

const ChatInput = ({ input, setInput, onSend }) => {
  return (
    <div style={{ display: "flex", marginTop: "10px" }}>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Напиши сообщение..."
        style={{
          flex: 1,
          padding: "10px",
          borderRadius: "10px",
          border: "1px solid #444",
          backgroundColor: "#1c1c1c",
          color: "#fff",
          outline: "none"
        }}
        onKeyDown={(e) => e.key === "Enter" && onSend()}
      />
      <button
        onClick={onSend}
        style={{
          padding: "10px 20px",
          marginLeft: "10px",
          borderRadius: "10px",
          border: "none",
          backgroundColor: "#4CAF50",
          color: "#fff",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        Отправить
      </button>
    </div>
  );
};

export default ChatInput;
