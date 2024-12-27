import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import cron from "node-cron";
import { z } from "zod";

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

await fastify.register(cors, {
  origin: "*",
});

const taskSchema = z.object({
  title: z.string().min(1, "O título é obrigatório."),
  description: z.string().min(1, "A descrição é obrigatória."),
  time: z.enum(["morning", "afternoon", "evening"]).default("morning"),
  status: z.enum(["not_started", "in_progress", "done"]).default("not_started"),
});

fastify.get("/", async () => {
  return { message: "API is running!" };
});

fastify.get("/tasks", async () => {
  return await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
  });
});

fastify.get("/tasks/:id", async (request, reply) => {
  const id = request.params.id;

  if (!id || typeof id !== "string") {
    return reply.status(400).send({ error: "ID inválido" });
  }

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return reply.status(404).send({ error: "Tarefa não encontrada" });
  return task;
});

fastify.post("/tasks", async (request, reply) => {
  try {
    const data = taskSchema.parse(request.body); // Validação do corpo
    const task = await prisma.task.create({ data });
    return task;
  } catch (error) {
    reply.status(400).send({ error: "Dados inválidos" });
  }
});

fastify.patch("/tasks/:id", async (request, reply) => {
  const id = request.params.id;

  if (!id || typeof id !== "string") {
    return reply.status(400).send({ error: "ID inválido" });
  }

  try {
    const data = taskSchema.partial().parse(request.body); // Validação parcial
    const updatedTask = await prisma.task.update({
      where: { id },
      data,
    });
    return updatedTask;
  } catch (error) {
    reply.status(404).send({ error: "Tarefa não encontrada" });
  }
});

fastify.delete("/tasks/:id", async (request, reply) => {
  const id = request.params.id;

  if (!id || typeof id !== "string") {
    return reply.status(400).send({ error: "ID inválido" });
  }

  try {
    const deletedTask = await prisma.task.delete({ where: { id } });
    return deletedTask;
  } catch (error) {
    reply.status(404).send({ error: "Tarefa não encontrada" });
  }
});

fastify.get("/water-hydration", async () => {
  return await prisma.waterHydration.findMany();
});

fastify.post("/water-hydration", async (request, reply) => {
  const { liters } = request.body;

  if (typeof liters !== "number" || liters < 0) {
    return reply.status(400).send({ error: "Quantidade inválida" });
  }

  const record = await prisma.waterHydration.upsert({
    where: { id: "temp-fixed-id" },
    update: { liters },
    create: { id: "temp-fixed-id", liters },
  });

  return record;
});

cron.schedule("0 0 * * *", async () => {
  try {
    await prisma.waterHydration.update({
      where: { id: "temp-fixed-id" },
      data: { liters: 0 },
    });
    console.log("Liters value reset to 0 at midnight");
  } catch (error) {
    console.error("Error resetting liters value:", error);
  }
});

const start = async () => {
  try {
    const port = process.env.PORT || 3100;
    const host = "0.0.0.0";
    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
