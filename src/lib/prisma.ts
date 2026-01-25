import { PrismaClient } from '@prisma/client';
import { Return } from '@prisma/client/runtime/library';

const prismaClientSingleton = () => {
    return new PrismaClient();
}

declare const globalThis: {
    prismaGlobal: Return<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;