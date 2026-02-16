const express = require("express");
const { addExpense, getExpenses, deleteExpense } = require("../controllers/expenseController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add", authMiddleware, addExpense);
router.get("/get", authMiddleware, getExpenses);
router.delete("/delete/:id", authMiddleware, deleteExpense);

module.exports = router;
