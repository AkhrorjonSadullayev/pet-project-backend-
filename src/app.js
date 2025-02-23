import express from "express";
import { PORT } from "./utils/secrets.js";
import { Routes } from "./routes/index.js";
import { MONGODB_CONNECT } from "./utils/database.config.js";
import cors from 'cors'
import { errorMiddleware } from "./middleware/error.middleware.js";
const server = express();

void MONGODB_CONNECT();

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cors({}));

server.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running!" });
})

Routes.forEach((item)=>{
  server.use(item.path,item.router)
})

server.use(errorMiddleware);

server.listen(PORT, () => {
  console.log(`Server Run Port ${PORT}!`);
});
