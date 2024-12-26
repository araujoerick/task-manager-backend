import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

await fastify.register(cors, {
  origin: true,
});

fastify.get("/tasks", async (request, reply) => {
  const tasks = await prisma.task.findMany();
  return tasks;
});

fastify.post("/tasks", async (request, reply) => {
  const { title, description, time, status } = request.body;
  const task = await prisma.task.create({
    data: { title, description, time, status },
  });
  return task;
});

fastify.get("/water-hydration", async (request, reply) => {
  const records = await prisma.waterHydration.findMany();
  return records;
});

fastify.post("/water-hydration", async (request, reply) => {
  const { liters } = request.body;
  const record = await prisma.waterHydration.create({
    data: { liters },
  });
  return record;
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
