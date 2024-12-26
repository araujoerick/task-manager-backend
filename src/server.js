import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

await fastify.register(cors, {
  origin: true,
});

fastify.get("/tasks", async (request, reply) => {
  const tasks = await prisma.task.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  return tasks;
});

fastify.get("/tasks/:id", async (request, reply) => {
  const { id } = request.params;

  try {
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return reply.status(404).send({ error: "Tarefa não encontrada" });
    }

    return task;
  } catch (error) {
    reply.status(500).send({ error: "Erro ao buscar a tarefa" });
  }
});

fastify.post("/tasks", async (request, reply) => {
  const { title, description, time, status } = request.body;
  const task = await prisma.task.create({
    data: { title, description, time, status },
  });
  return task;
});

fastify.patch("/tasks/:id", async (request, reply) => {
  const { id } = request.params;
  const { title, description, time, status } = request.body;

  try {
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { title, description, time, status },
    });

    return updatedTask;
  } catch (error) {
    reply.status(404).send({ error: "Tarefa não encontrada" });
  }
});

fastify.delete("/tasks/:id", async (request, reply) => {
  const { id } = request.params;

  try {
    const deletedTask = await prisma.task.delete({
      where: { id },
    });

    return deletedTask;
  } catch (error) {
    reply.status(404).send({ error: "Tarefa não encontrada" });
  }
});

fastify.get("/water-hydration", async (request, reply) => {
  const records = await prisma.waterHydration.findMany();
  return records;
});

fastify.post("/water-hydration", async (request, reply) => {
  const { liters } = request.body;
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
    await fastify.listen({ port: 3100 });
    fastify.log.info(`Server listening on http://localhost:3100`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
