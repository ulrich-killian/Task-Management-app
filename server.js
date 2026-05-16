import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import paginate from "express-paginate";
import helmet from 'helmet';

import { testConnection } from "./src/config/db.js";
import userRoutes from "./src/routes/userRoutes/userRoutes.js";
import taskRoutes from "./src/routes/taskRoutes/taskRoutes.js";
import { generalLimiter } from "./src/middleware/rateLimit.js";


import { createTables } from './src/schema/query.js';   

import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';

dotenv.config();

const app = express();


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
  }
}));

app.get('/api-docs-json', (req, res) => res.json(swaggerSpec));

app.set("trust proxy", 1);
const port = process.env.PORT || 3000;

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
      console.log(` Server running on http://localhost:${port}`);
      console.log(` Swagger UI: http://localhost:${port}/api-docs`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();