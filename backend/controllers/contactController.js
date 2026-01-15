const Contact = require("../models/Contact");
const { Resend } = require("resend");
require("dotenv").config();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * submitContact
 * body: { name, email, phone, message }
 */
const submitContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ error: "name, email and message are required" });
    }

    const contact = new Contact({ name, email, phone, message });
    await contact.save();

    // Send email notification via Resend
    await resend.emails.send({
      from: process.env.FROM_EMAIL,       // verified email or onboarding@resend.dev
      to: process.env.ADMIN_EMAIL,        // your Gmail or recipient email
      subject: `New Contact Submission from ${name}`,
      text: `
You have a new contact form submission:

Name: ${name}
Email: ${email}
Phone: ${phone || "N/A"}
Message: ${message}

Submitted at: ${new Date().toLocaleString()}
      `,
    });

    return res.status(201).json({ success: true, message: "Contact saved" });
  } catch (error) {
    console.error("Contact controller error:", error);
    return res.status(500).json({ error: "Failed to save contact" });
  }
};

const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, data: contacts });
  } catch (error) {
    console.error("Get contacts error:", error);
    return res.status(500).json({ error: "Failed to get contacts" });
  }
};

module.exports = { submitContact, getContacts };