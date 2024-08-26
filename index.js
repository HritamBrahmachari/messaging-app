require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// Initialize the Express app and the HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Allow connection from the frontend
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/messaging-app", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Message schema and model
const messageSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

// Handle socket connections
io.on("connection", (socket) => {
  console.log("A user connected");

  // Listen for messages from the client
  socket.on("sendMessage", (data) => {
    console.log("Message received:", data); // For debugging

    // Save the message to MongoDB
    const { sender, receiver, content } = data;
    const message = new Message({ sender, receiver, content });

    message
      .save()
      .then(() => {
        console.log("Message saved to database"); // Log successful save
        // Emit the message to the recipient (or all clients if using io.emit)
        io.emit("receiveMessage", data);
      })
      .catch((err) => {
        console.error("Error saving message to database:", err);
      });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// API route for testing the server
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Start the server
const PORT = process.env.PORT || 5000; // Use process.env.PORT or default to 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
