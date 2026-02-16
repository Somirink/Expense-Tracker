import { useEffect, useState } from "react";
import API from "../services/api";
import { FaList, FaChartBar } from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [view, setView] = useState("analytics");
  const [showModal, setShowModal] = useState(false);

  const [filterType, setFilterType] = useState("ALL");
  const [filterRange, setFilterRange] = useState("ALL");

  const [form, setForm] = useState({
    amount: "",
    category: "",
    type: "expense",
    reference: "",
    description: "",
    date: "",
  });

  const user = JSON.parse(localStorage.getItem("user"));

  // ================= FETCH =================
  const fetchData = async () => {
    const res = await API.get("/expense/get");
    setTransactions(res.data);
    setFiltered(res.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= FILTER =================
  useEffect(() => {
    let data = [...transactions];

    if (filterType !== "ALL") {
      data = data.filter(
        (t) => t.type === filterType.toLowerCase()
      );
    }

    if (filterRange !== "ALL") {
      const now = new Date();
      const days =
        filterRange === "WEEK"
          ? 7
          : filterRange === "MONTH"
          ? 30
          : 365;

      data = data.filter(
        (t) =>
          (now - new Date(t.date)) /
            (1000 * 60 * 60 * 24) <=
          days
      );
    }

    setFiltered(data);
  }, [filterType, filterRange, transactions]);

  // ================= TOTALS =================
  const income = filtered
    .filter((t) => t.type === "income")
    .reduce((a, b) => a + Number(b.amount), 0);

  const expense = filtered
    .filter((t) => t.type === "expense")
    .reduce((a, b) => a + Number(b.amount), 0);

  const totalBalance = income - expense;

  // ================= CATEGORY DATA =================
  const groupByCategory = (type) => {
    const data = filtered.filter((t) => t.type === type);
    const map = {};
    data.forEach((t) => {
      map[t.category] =
        (map[t.category] || 0) + Number(t.amount);
    });

    return Object.keys(map).map((key) => ({
      name: key,
      value: map[key],
    }));
  };

  const incomeData = groupByCategory("income");
  const expenseData = groupByCategory("expense");

  const COLORS = ["#6C63FF", "#FF6584", "#20C997", "#FFC107"];

  // ================= ADD =================
  const addTransaction = async () => {
    await API.post("/expense/add", form);
    setShowModal(false);
    setForm({
      amount: "",
      category: "",
      type: "expense",
      reference: "",
      description: "",
      date: "",
    });
    fetchData();
  };

  // ================= DELETE =================
  const deleteTransaction = async (id) => {
    await API.delete(`/expense/delete/${id}`);
    fetchData();
  };

  // ================= LOGOUT =================
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div style={container}>
      {/* HEADER */}
      <div style={header}>
        <h2 style={titleStyle}>Income-Expense Management</h2>

        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <span style={userNameStyle}>
            👤 {user?.name || "User"}
          </span>
          <button style={logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={filterBar}>
        <div style={filterLeft}>
          <div style={filterItem}>
            <label style={labelStyle}>Select Frequency</label>
            <select
              value={filterRange}
              onChange={(e) => setFilterRange(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="WEEK">Last 1 Week</option>
              <option value="MONTH">Last 1 Month</option>
              <option value="YEAR">Last 1 Year</option>
            </select>
          </div>

          <div style={filterItem}>
            <label style={labelStyle}>Select Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>
        </div>

        <div style={filterRight}>
          <div style={toggleBox}>
            <FaList
              onClick={() => setView("table")}
              style={view === "table" ? activeIcon : iconStyle}
            />
            <FaChartBar
              onClick={() => setView("analytics")}
              style={view === "analytics" ? activeIcon : iconStyle}
            />
          </div>

          <button
            style={addBtn}
            onClick={() => setShowModal(true)}
          >
            Add New
          </button>
        </div>
      </div>

      {/* ANALYTICS VIEW */}
      {view === "analytics" && (
        <div style={cardRow}>
          <div style={card}>
            <div style={cardTitle}>Total Transactions</div>
            <h3>{filtered.length}</h3>
          </div>

          <div style={card}>
            <div style={cardTitle}>Total Balance</div>
            <h3>₹{totalBalance}</h3>
            <p style={{ color: "green" }}>Income: ₹{income}</p>
            <p style={{ color: "red" }}>Expense: ₹{expense}</p>
          </div>

          <div style={card}>
            <div style={greenTitle}>Categorywise Income</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={incomeData} dataKey="value">
                  {incomeData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={card}>
            <div style={greenTitle}>Categorywise Expense</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={expenseData} dataKey="value">
                  {expenseData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TABLE VIEW */}
      {view === "table" && (
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeader}>
              <th>Date</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Type</th>
              <th>Reference</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t._id} style={tableRow}>
                <td>{new Date(t.date).toLocaleDateString()}</td>
                <td>₹{t.amount}</td>
                <td>{t.category}</td>
                <td>{t.type}</td>
                <td>{t.reference}</td>
                <td>{t.description}</td>
                <td>
                  <button
                    style={deleteBtn}
                    onClick={() => deleteTransaction(t._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* MODAL */}
      {showModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>Add Transaction</h3>

            <input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) =>
                setForm({ ...form, amount: e.target.value })
              }
            />

            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value })
              }
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <input
              placeholder="Category"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            />

            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
            />

            <input
              placeholder="Reference"
              value={form.reference}
              onChange={(e) =>
                setForm({ ...form, reference: e.target.value })
              }
            />

            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <button style={addBtn} onClick={addTransaction}>
                Save
              </button>
              <button
                style={logoutBtn}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

/* ================= STYLES ================= */

const container = {
  padding: "30px",
  background: "#f5f6fa",
  minHeight: "100vh",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "25px",
};

const titleStyle = {
  color: "#7a5c3e",
  fontWeight: "600",
};

const userNameStyle = {
  fontWeight: "500",
  color: "#555",
};

const filterBar = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "25px",
  background: "#fff",
  padding: "15px 20px",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const filterLeft = {
  display: "flex",
  gap: "60px",
  alignItems: "center",
};

const filterItem = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const labelStyle = {
  fontSize: "14px",
  fontWeight: "500",
};

const filterRight = {
  display: "flex",
  gap: "35px",
  alignItems: "center",
};

const toggleBox = {
  display: "flex",
  gap: "15px",
  background: "#f0f0f0",
  padding: "8px 12px",
  borderRadius: "8px",
};

const iconStyle = { cursor: "pointer" };
const activeIcon = { cursor: "pointer", color: "#6C63FF" };

const addBtn = {
  background: "#6C63FF",
  color: "white",
  border: "none",
  padding: "8px 18px",
  borderRadius: "8px",
  cursor: "pointer",
};

const logoutBtn = {
  background: "#ff4d4f",
  color: "white",
  border: "none",
  padding: "8px 18px",
  borderRadius: "8px",
  cursor: "pointer",
};

const cardRow = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "20px",
};

const card = {
  background: "#fff",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
};

const cardTitle = {
  background: "linear-gradient(to right,#6C63FF,#9F44D3)",
  color: "white",
  padding: "6px 10px",
  borderRadius: "6px",
  marginBottom: "15px",
};

const greenTitle = {
  background: "linear-gradient(to right,#20C997,#28A745)",
  color: "white",
  padding: "6px 10px",
  borderRadius: "6px",
  marginBottom: "15px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fff",
  borderRadius: "12px",
  overflow: "hidden",
};

const tableHeader = {
  background: "linear-gradient(to right,#6C63FF,#9F44D3)",
  color: "white",
};

const tableRow = {
  textAlign: "center",
  borderBottom: "1px solid #eee",
};

const deleteBtn = {
  background: "#ff4d4f",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "6px",
  cursor: "pointer",
};

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.3)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalBox = {
  background: "#fff",
  padding: "25px",
  width: "350px",
  borderRadius: "12px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};
