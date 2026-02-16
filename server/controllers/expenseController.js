const Expense = require("../models/Expense");

// ================= ADD =================
exports.addExpense = async (req, res) => {
  try {
    const { amount, type, category, reference, description, date } = req.body;

    const expense = new Expense({
      user: req.user,
      amount,
      type,
      category,
      reference,
      description,  // ✅ VERY IMPORTANT
      date,
    });

    await expense.save();

    res.status(201).json({ message: "Expense added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET =================
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= DELETE =================
exports.deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
