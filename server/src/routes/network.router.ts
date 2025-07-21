import { Router, type Request, type Response } from "express";
import catchAsync from "src/lib/utils";
import { exec } from "child_process";

const router = Router();

router.get(
  "/scan",
  catchAsync(async (req: Request, res: Response) => {
    console.log(process.cwd());
    exec("sudo ./scan.sh", (err, stdout, stderr) => {
      if (err) {
        console.error("Script error:", err);
        return res
          .status(500)
          .json({ message: "Error occurred: " + err.message });
      }

      if (stderr) {
        console.warn("Script stderr:", stderr);
        return res.status(500).json({ message: "Error occurred: " });
      }

      return res.status(200).json({ message: JSON.parse(stdout.trim()) });
    });
  })
);

export default router;
