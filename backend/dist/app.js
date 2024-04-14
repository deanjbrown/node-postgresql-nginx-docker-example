"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const host = process.env.host;
const port = process.env.PORT;
app.get("/", (req, res) => {
    return res.status(200).json({ message: "Hello World" });
});
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://${host}:${port}`);
});
