import { Router } from "express";
import { z } from "zod";
import { loginUser, registerUser } from "../services/authService.js";

const router = Router();

router.post("/register", async (req, res) => {
  const parsed = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });

  try {
    const user = await registerUser(parsed.data.name, parsed.data.email, parsed.data.password);
    return res.status(201).json(user);
  } catch {
    return res.status(409).json({ message: "User already exists" });
  }
});

router.post("/login", async (req, res) => {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });

  const result = await loginUser(parsed.data.email, parsed.data.password);
  if (!result) return res.status(401).json({ message: "Invalid credentials" });
  return res.json(result);
});

export default router;
