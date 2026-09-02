const User = require("../models/user");
const Department = require("../models/Department");
const Issue = require("../models/Issue");
const Notification = require("../models/Notification");

const ASSIGNABLE_ROLES = ["authority"];
const VALID_ROLES = ["user", "authority", "corporate_leader", "admin"];

const getAssignableUsers = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const department = req.query.department?.trim();
    const filter = { role: { $in: ASSIGNABLE_ROLES }, isActive: true };

    if (department) filter.department = department;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("name email role department isActive")
      .populate("department", "name code")
      .sort({ name: 1 })
      .limit(100);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const role = req.query.role?.trim();
    const filter = {};

    if (role && VALID_ROLES.includes(role)) filter.role = role;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("name email role department isActive createdAt")
      .populate("department", "name code")
      .sort({ createdAt: -1 })
      .limit(200);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: "You cannot modify your own account here" });
    }

    const { role, department, isActive } = req.body;
    const previousRole = user.role;
    const wasActive = user.isActive !== false;

    if (role !== undefined && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid user role" });
    }

    const nextRole = role ?? user.role;
    const nextDepartment = department !== undefined ? department : user.department;

    if (["authority", "corporate_leader"].includes(nextRole) && !nextDepartment) {
      return res.status(400).json({ message: "Staff leadership users must belong to a department" });
    }

    if (department !== undefined && department !== null && department !== "") {
      const departmentExists = await Department.exists({ _id: department, active: true });
      if (!departmentExists) {
        return res.status(400).json({ message: "Department not found or inactive" });
      }
      user.department = department;
    } else if (department !== undefined) {
      user.department = null;
    }

    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = Boolean(isActive);

    if (!["authority", "corporate_leader"].includes(user.role)) user.department = null;
    if (["authority", "corporate_leader"].includes(user.role) && !user.department) {
      return res.status(400).json({ message: "Staff leadership users must belong to a department" });
    }

    await user.save();

    const authorityUnavailable = previousRole === "authority" && (user.role !== "authority" || user.isActive === false);
    if (authorityUnavailable) {
      const assignedIssues = await Issue.find({ assignedTo: user._id }).select("_id title createdBy");
      if (assignedIssues.length > 0) {
        await Issue.updateMany({ assignedTo: user._id }, { $set: { assignedTo: null } });
        await Notification.insertMany(
          assignedIssues.map((issue) => ({
            recipient: issue.createdBy,
            issue: issue._id,
            type: "system",
            title: "Issue needs reassignment",
            message: `The authority previously assigned to “${issue.title}” is no longer available. A department leader or administrator needs to assign a new authority.`,
          }))
        );
      }
    }

    if (!wasActive && user.isActive && ["authority", "corporate_leader"].includes(user.role)) {
      await Notification.create({
        recipient: user._id,
        type: "system",
        title: "Staff account activated",
        message: "Your CommunityServe staff account is active again.",
      });
    }

    const updatedUser = await user.populate("department", "name code");
    res.status(200).json(updatedUser.toObject({ versionKey: false }));
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAssignableUsers, getUsers, updateUser };
