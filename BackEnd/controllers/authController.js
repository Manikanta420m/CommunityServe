const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department || null,
  isActive: user.isActive !== false,
  createdAt: user.createdAt,
});

const createToken = (userId) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must contain at least 6 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: hashedPassword });

    res.status(201).json({
      message: "User registered successfully",
      token: createToken(user._id),
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: "User already exists" });
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email: email?.trim().toLowerCase() }).populate("department", "name code");

    if (!user || !password) return res.status(400).json({ message: "Invalid credentials" });
    if (user.isActive === false) return res.status(403).json({ message: "This account has been deactivated" });
    if (role && user.role !== role) return res.status(403).json({ message: "This account does not have access to this portal" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.status(200).json({ message: "Login successful", token: createToken(user._id), user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  const user = await req.user.populate("department", "name code");
  res.status(200).json({ user: sanitizeUser(user) });
};

module.exports = { registerUser, loginUser, getCurrentUser };
