require("dotenv").config();
const express = require("express");
const mariadb = require("mariadb");
const cors = require("cors");
const path = require("path");

const app = express();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

console.log(process.env.DB_HOST);
console.log(process.env.DB_PORT);
console.log(process.env.DB_USER);
console.log(process.env.DB_PASSWORD);
console.log(process.env.DB_NAME);

pool
  .getConnection()
  .then((conn) => {
    console.log("Conexão com o banco de dados estabelecida.");
    conn.end();
  })
  .catch((erro) => {
    console.log("Erro ao conectar com o banco de dados:", erro);
  });

app.use(cors());

app.get("/api/test", (req, res) => {
  res.json({ message: "API funcionando" });
});

app.get("/api/patogeno", async (req, res) => {
  console.log("Iniciando a consulta na tabela patogeno...");
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM patogeno");
    console.log("Resultado da consulta:", rows);
    res.json(rows);
  } catch (err) {
    console.log("Erro durante a consulta:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/patogeno/:id", async (req, res) => {
  let conn;
  const { id } = req.params;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM patogeno WHERE id = ?", [id]);
    if (rows.length === 0) {
      res.status(404).json({ message: "Patógeno não encontrado" });
    } else {
      res.json(rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/doenca", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM doenca");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/sintoma", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM sintoma");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/nomes_populares", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM nomes_populares");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.end();
  }
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "build")));

  app.get("/patogeno/view", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
  });

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
  });
}

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
