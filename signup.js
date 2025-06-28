const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3020;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/brightmind", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((error) => console.error("❌ MongoDB connection error:", error));

// Schemas
const userRegistrationSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  age:       { type: String, required: true },
  agreeToTerms:   { type: Boolean, required: true },
  agreeToPrivacy: { type: Boolean, required: true },
  subscribeNewsletter: { type: Boolean, default: false },
  registeredAt: { type: Date, default: Date.now },
});

const contactFormSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true },
  phone:    { type: String, default: "" },
  urgency:  { type: String, required: true },
  message:  { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
});

const UserRegistration = mongoose.model("UserRegistration", userRegistrationSchema);
const ContactForm = mongoose.model("ContactForm", contactFormSchema);

// Root Route - Fixes "Cannot GET /"
app.get("/", (req, res) => {
  res.send("🌟 Welcome to the BrightMind API! Visit /api/health for status.");
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BrightMind API is running",
    timestamp: new Date().toISOString(),
  });
});

// Register user
app.post("/api/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, age, agreeToTerms, agreeToPrivacy, subscribeNewsletter } = req.body;

    const existingUser = await UserRegistration.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "This email is already registered." });
    }

    const user = new UserRegistration({
      firstName, lastName, email, password, age, agreeToTerms, agreeToPrivacy, subscribeNewsletter,
    });

    await user.save();
    console.log("✅ New user registered:", email);

    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      data: { id: user._id, firstName, lastName, email },
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ success: false, message: "Registration failed. Try again later." });
  }
});

// Contact form submission
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, urgency, message } = req.body;

    const contact = new ContactForm({ name, email, phone, urgency, message });
    await contact.save();
    console.log("✅ Contact form submitted:", email);

    res.status(201).json({
      success: true,
      message: "Message sent successfully!",
      data: { id: contact._id, name, email, urgency },
    });
  } catch (error) {
    console.error("❌ Contact form error:", error);
    res.status(500).json({ success: false, message: "Message failed. Try again later." });
  }
});

// Admin: Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await UserRegistration.find({}, "-password");
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error("❌ Fetch users error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users." });
  }
});

// Admin: Get all contacts
app.get("/api/contacts", async (req, res) => {
  try {
    const contacts = await ContactForm.find({});
    res.status(200).json({ success: true, count: contacts.length, data: contacts });
  } catch (error) {
    console.error("❌ Fetch contacts error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch contacts." });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 BrightMind API running at http://localhost:${port}`);
  console.log("📡 Endpoints:");
  console.log("- GET    /                → Welcome message");
  console.log("- GET    /api/health      → API health check");
  console.log("- POST   /api/register    → User registration");
  console.log("- POST   /api/contact     → Contact form submission");
  console.log("- GET    /api/users       → Admin - list users");
  console.log("- GET    /api/contacts    → Admin - list contacts");
});
