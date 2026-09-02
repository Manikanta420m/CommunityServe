const User = require("../models/user");

const getAssignableUsers = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const filter = { role: { $in: ["admin", "authority"] } };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("name email role")
      .sort({ name: 1 })
      .limit(100);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAssignableUsers };
