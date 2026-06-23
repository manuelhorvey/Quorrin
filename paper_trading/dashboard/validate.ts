import { readFileSync } from 'fs';
import { EngineSnapshotSchema } from './src/lib/schemas.js';

try {
  const jsonStr = readFileSync('../../data/live/state.json', 'utf8');
  const json = JSON.parse(jsonStr);
  const parsed = EngineSnapshotSchema.safeParse(json);
  if (!parsed.success) {
    console.log("Validation failed! Number of issues:", parsed.error.issues.length);
    console.log(JSON.stringify(parsed.error.issues, null, 2));
  } else {
    console.log("Validation succeeded! state.json is completely valid.");
  }
} catch (err) {
  console.error("Error running validation:", err);
}
