import { fork } from "child_process";
import path from "path";

const workerScript = path.resolve(__dirname, "worker.ts");

const nums = [
  "00",
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
];

let activeWorkers = nums.length;

nums.forEach((num) => {
  const worker = fork(workerScript, [num]);
  worker.on("message", (msg) => {
    console.log(`Worker ${num} message:`, msg);
  });
  worker.on("exit", (code) => {
    console.log(`Worker ${num} exited with code ${code}`);
    activeWorkers--;
    console.log(`Active workers: ${activeWorkers}`);
    if (activeWorkers === 0) {
      console.log("All workers have exited, exiting main process.");
      process.exit(); // all workers have exited
    }
  });
});
