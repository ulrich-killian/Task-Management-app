import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import paginate from "express-paginate";
import { testConnection } from "./src/config/db.js";
import userRoutes from "./src/routes/userRoutes/userRoutes.js";
import taskRoutes from "./src/routes/taskRoutes/taskRoutes.js";
import { generalLimiter } from "./src/middleware/rateLimit.js";
import helmet from 'helmet';
import { createTables, addTestData } from './src/schema/query.js';

dotenv.config();

const app = express();
app.set("trust proxy", 1);

const port = process.env.PORT;

app.use(helmet());                   
app.use(cors());                      
app.use(express.json());              
app.use(paginate.middleware(10, 50)); 
app.use(generalLimiter);            

app.use("/api/user", userRoutes);
app.use("/api/tasks", taskRoutes);

app.get("/", (req, res) => {
  res.send("Server is running live");
});

const startServer = async () => {
  try {
    await testConnection();
    await createTables();
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
