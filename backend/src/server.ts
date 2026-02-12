import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import pageRoutes from "./routes/pageRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api/v1", (_req, res) => res.json({ status: "ok", message: "Wiki API ready" }));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/pages", pageRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/notifications", notificationRoutes);

app.listen(env.port, () => console.log(`Backend listening on ${env.port}`));
