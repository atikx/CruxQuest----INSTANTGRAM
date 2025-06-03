import { ConsoleLogWriter } from "drizzle-orm";
import { db } from "./drizzle/db";
import { UsersTable } from "./drizzle/schema";

async function main() {
  await db.insert(UsersTable).values({
    name: "Atiksh",
  });
  const user = await db.query.UsersTable.findFirst();
  console.log(user);
}

main();
