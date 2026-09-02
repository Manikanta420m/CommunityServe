const Department = require("../models/Department");

const defaultDepartments = [
  ["Roads & Infrastructure", "ROADS"],
  ["Sanitation & Garbage", "SANITATION"],
  ["Water Supply", "WATER"],
  ["Electricity & Streetlights", "ELECTRICITY"],
  ["Drainage", "DRAINAGE"],
  ["General Civic Services", "GENERAL"],
];

const getDepartments = async (req, res) => {
  try {
    const existing = await Department.find({ active: true }).sort({ name: 1 });

    if (existing.length === 0) {
      await Department.insertMany(
        defaultDepartments.map(([name, code]) => ({ name, code }))
      );
    }

    const departments = await Department.find({ active: true }).sort({ name: 1 });
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name?.trim() || !code?.trim()) {
      return res.status(400).json({ message: "Department name and code are required" });
    }

    const department = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || "",
    });

    res.status(201).json(department);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Department name or code already exists" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDepartments, createDepartment };
