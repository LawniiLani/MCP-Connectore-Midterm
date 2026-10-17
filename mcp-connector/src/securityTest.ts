import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const WORKSPACE = path.resolve(path.dirname(__filename), "../../workspace");

function enforceSandbox(requestedPath: string): string {
  const rootBoundary = path.resolve(WORKSPACE) + path.sep;
  const target = path.resolve(WORKSPACE, requestedPath);
  if (target !== path.resolve(WORKSPACE) && !target.startsWith(rootBoundary)) {
    throw new Error(`Sandbox violation: Cannot access ${requestedPath}`);
  }
  return target;
}

console.log("Running Security Tests...");
try {
    enforceSandbox("../../Windows/System32");
    console.error("FAIL: Allowed escaping the sandbox!");
} catch (e) {
    console.log("PASS: Blocked directory traversal (../../Windows/System32)");
}

try {
    enforceSandbox("fibonacci.py");
    console.log("PASS: Allowed safe local file (fibonacci.py)");
} catch (e) {
    console.error("FAIL: Blocked a safe file!");
}