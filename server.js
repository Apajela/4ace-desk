// server.ts
import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});
app.use(express.json({ limit: "20mb" }));
var projects = [
  {
    id: "proj-1",
    name: "Residential Renovation",
    code: "4ACE-RR-01",
    client: "Atty. Roberto Valenzuela",
    location: "Antipolo Hills, Rizal",
    category: "Residential",
    status: "In Progress",
    budget: 25e4,
    spent: 50150,
    startDate: "2026-10-01",
    targetDate: "2026-12-15",
    supervisor: "Mang Nestor Dela Cruz (Foreman)",
    progress: 20.1,
    description: "Ground floor structural expansion, masonry wall finishing, and tile fit-out."
  },
  {
    id: "proj-2",
    name: "Modern 2-Storey Commercial Unit",
    code: "4ACE-CU-02",
    client: "Summit Commercial Holdings",
    location: "Bonifacio Global City, Taguig",
    category: "Commercial",
    status: "In Progress",
    budget: 185e4,
    spent: 62e4,
    startDate: "2026-08-15",
    targetDate: "2027-02-28",
    supervisor: "Project Engineer",
    progress: 33.5,
    description: "Reinforced concrete framing, steel deck casting, and MEP roughing-ins."
  }
];
var workers = [
  { id: "w-1", name: "Mang Nestor Dela Cruz", role: "General Foreman", dailyRate: 1e3, phone: "+63 917 555 0101", status: "Active" },
  { id: "w-2", name: 'Danilo "Jun" Ramos', role: "Lead Mason", dailyRate: 750, phone: "+63 917 555 0102", status: "Active" },
  { id: "w-3", name: "Ernesto Morales", role: "Finishing Mason", dailyRate: 750, phone: "+63 917 555 0103", status: "Active" },
  { id: "w-4", name: "Ronaldo Bautista", role: "Master Carpenter", dailyRate: 750, phone: "+63 917 555 0104", status: "Active" },
  { id: "w-5", name: "Karlo Mendoza", role: "Carpenter (Formworks)", dailyRate: 750, phone: "+63 917 555 0105", status: "Active" },
  { id: "w-6", name: "Jerry Villanueva", role: "Lead Painter", dailyRate: 650, phone: "+63 917 555 0106", status: "Active" },
  { id: "w-7", name: "Arnel Castro", role: "Helper / Laborer", dailyRate: 500, phone: "+63 917 555 0107", status: "Active" },
  { id: "w-8", name: "Mark Anthony Diaz", role: "Helper / Laborer", dailyRate: 500, phone: "+63 917 555 0108", status: "Active" }
];
var expenses = [
  {
    id: "exp-1",
    projectId: "proj-1",
    projectName: "Residential Renovation",
    category: "Materials",
    amount: 18500,
    date: "2026-10-24",
    vendor: "Holcim Ready-Mix & Aggregates Corp.",
    invoiceNumber: "INV-90412",
    notes: "15 Bags Portland Type 1 Cement & Washed Sand",
    paymentStatus: "Paid"
  },
  {
    id: "exp-2",
    projectId: "proj-1",
    projectName: "Residential Renovation",
    category: "Materials",
    amount: 13650,
    date: "2026-10-24",
    vendor: "Apex Hardware & Steel Supply",
    invoiceNumber: "INV-90488",
    notes: "Grade 40 12mm Rebar & G.I. Tie Wire Spools",
    paymentStatus: "Paid"
  },
  {
    id: "exp-3",
    projectId: "proj-1",
    projectName: "Residential Renovation",
    category: "Labor",
    amount: 18e3,
    date: "2026-10-24",
    vendor: "Weekly Field Labor Payroll",
    invoiceNumber: "PR-WK-42",
    notes: "Weekly payroll release for 8 field laborers and carpenters",
    paymentStatus: "Paid"
  }
];
var attendance = [];
var cashAdvances = [];
var priorities = [
  {
    id: "prio-1",
    projectId: "proj-1",
    title: "Call Ready-Mix concrete supplier for 2:00 PM slab pour delivery",
    completed: false,
    priority: "urgent",
    siteName: "Residential Renovation",
    assignedTo: "Mang Nestor Dela Cruz",
    dueDate: "Today, 2:00 PM",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "prio-2",
    projectId: "proj-1",
    title: "Inspect scaffolding cross-bracing and fall safety harness clips",
    completed: false,
    priority: "urgent",
    siteName: "Residential Renovation",
    assignedTo: "Project Engineer",
    dueDate: "Today, Morning",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    app: "4Ace Desk Construction ERP",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: process.uptime()
  });
});
app.get("/api/projects", (_req, res) => {
  res.json({ success: true, data: projects });
});
app.post("/api/projects", (req, res) => {
  const newProject = { ...req.body, id: `proj-${Date.now()}` };
  projects.unshift(newProject);
  res.status(201).json({ success: true, data: newProject });
});
app.get("/api/workers", (_req, res) => {
  res.json({ success: true, data: workers });
});
app.post("/api/workers", (req, res) => {
  const newWorker = { ...req.body, id: `w-${Date.now()}` };
  workers.push(newWorker);
  res.status(201).json({ success: true, data: newWorker });
});
app.delete("/api/workers/:id", (req, res) => {
  const { id } = req.params;
  workers = workers.filter((w) => w.id !== id);
  attendance = attendance.filter((a) => a.workerId !== id);
  cashAdvances = cashAdvances.filter((ca) => ca.workerId !== id);
  res.json({ success: true, message: `Worker ${id} removed successfully.` });
});
app.get("/api/attendance", (_req, res) => {
  res.json({ success: true, data: attendance });
});
app.post("/api/attendance/time-in", (req, res) => {
  const record = { ...req.body, id: `att-${Date.now()}` };
  attendance.unshift(record);
  res.status(201).json({ success: true, data: record });
});
app.patch("/api/attendance/time-out/:id", (req, res) => {
  const { id } = req.params;
  const now = /* @__PURE__ */ new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  attendance = attendance.map((a) => a.id === id ? { ...a, timeOut: timeStr } : a);
  res.json({ success: true, timeOut: timeStr });
});
app.get("/api/expenses", (_req, res) => {
  res.json({ success: true, data: expenses });
});
app.post("/api/expenses", (req, res) => {
  const newExpense = { ...req.body, id: `exp-${Date.now()}` };
  expenses.unshift(newExpense);
  projects = projects.map(
    (p) => p.id === newExpense.projectId ? { ...p, spent: p.spent + Number(newExpense.amount) } : p
  );
  res.status(201).json({ success: true, data: newExpense });
});
app.delete("/api/expenses/:id", (req, res) => {
  const { id } = req.params;
  const target = expenses.find((e) => e.id === id);
  if (target) {
    projects = projects.map(
      (p) => p.id === target.projectId ? { ...p, spent: Math.max(0, p.spent - target.amount) } : p
    );
  }
  expenses = expenses.filter((e) => e.id !== id);
  res.json({ success: true, message: `Expense ${id} deleted.` });
});
app.get("/api/cash-advances", (_req, res) => {
  res.json({ success: true, data: cashAdvances });
});
app.post("/api/cash-advances", (req, res) => {
  const newCA = { ...req.body, id: `ca-${Date.now()}` };
  cashAdvances.unshift(newCA);
  res.status(201).json({ success: true, data: newCA });
});
app.get("/api/priorities", (_req, res) => {
  res.json({ success: true, data: priorities });
});
app.post("/api/priorities", (req, res) => {
  const newPrio = { ...req.body, id: `prio-${Date.now()}`, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
  priorities.unshift(newPrio);
  res.status(201).json({ success: true, data: newPrio });
});
app.patch("/api/priorities/:id/toggle", (req, res) => {
  const { id } = req.params;
  priorities = priorities.map((p) => p.id === id ? { ...p, completed: !p.completed } : p);
  res.json({ success: true });
});
var distPath = path.resolve(__dirname, "dist");
var publicPath = path.resolve(__dirname, "public");
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.send("4Ace Desk Backend Server is running. Run `npm run build` to generate frontend.");
  });
}
app.listen(PORT, "0.0.0.0", () => {
  console.log(`4Ace Desk Construction ERP server running on http://0.0.0.0:${PORT}`);
});
