import { writeFileSync } from "node:fs";
import { lessons } from "../app/catalog.ts";

const catalog = lessons.map(({ id, title, principles, example }) => ({ id, title, principles, example }));
writeFileSync(process.argv[2], JSON.stringify(catalog));
