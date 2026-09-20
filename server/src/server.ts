import express from "express";

const app = express();

const Port = 3000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "collabflow-api",
  });
});

app.listen(Port, () => {
  console.log(`CollabFlow API running on http://localhost:@{PORT}`);
});
