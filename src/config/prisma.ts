// Di file: src/config/prisma.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"], // Ini opsional, tapi bagus untuk debug
});

export default prisma;
