require("dotenv").config();
const express = require("express");
const mariadb = require("mariadb");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

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

app.get("/api/patogeno", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      "SELECT * FROM patogeno as p ORDER BY p.nome_cientifico ASC"
    );
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

app.post("/api/patogeno", async (req, res) => {
  let conn;
  const { nome_cientifico, tipo } = req.body;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      "INSERT INTO patogeno (nome_cientifico, tipo) VALUES (?, ?)",
      [nome_cientifico, tipo]
    );
    res.json({
      message: "Patógeno adicionado com sucesso",
    });
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
    const doencas = await conn.query("SELECT * FROM doenca");

    const doencasComNomesPopulares = await Promise.all(
      doencas.map(async (doenca) => {
        const patogeno = await conn.query(
          "SELECT * FROM patogeno AS p WHERE p.id = ?",
          [doenca.patogeno_id]
        );

        const nomesPopulares = await conn.query(
          "SELECT nome FROM nomes_populares WHERE doenca_id = ?",
          [doenca.id]
        );

        const sintomas = await conn.query(
          "SELECT * FROM sintoma AS s WHERE s.doenca_id = ?",
          [doenca.id]
        );

        const sintomasArray =
          sintomas.length > 0
            ? sintomas.map((s) => ({
                nome: s.nome,
                nivel_de_ocorrencia: s.nivel_de_ocorrencia,
              }))
            : undefined;

        const nomesPopularesArray =
          nomesPopulares.length > 0
            ? nomesPopulares.map((np) => np.nome)
            : undefined;

        return {
          id: doenca.id,
          patogeno: patogeno[0],
          CID: doenca.CID,
          nomes_tecnicos: doenca.nomes_tecnicos,
          nomes_populares: nomesPopularesArray,
          sintomas: sintomasArray,
        };
      })
    );

    res.json(doencasComNomesPopulares);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/doenca/:id", async (req, res) => {
  let conn;
  const { id } = req.params;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM doenca AS d WHERE d.id = ?", [
      id,
    ]);
    if (rows.length === 0) {
      res.status(404).json({ message: "Doença não encontrado" });
    } else {
      res.json(rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.end();
  }
});

app.post("/api/sintoma/:id", async (req, res) => {
  let conn;
  const { nome, nivel_de_ocorrencia } = req.body;
  const { id } = req.params;
  try {
    conn = await pool.getConnection();

    const result = await conn.query(
      "INSERT INTO sintoma (doenca_id, nome, nivel_de_ocorrencia) VALUES (?, ?, ?)",
      [id, nome, nivel_de_ocorrencia]
    );

    res.json({
      message: "Doença adicionada com sucesso",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/sintoma/:id", async (req, res) => {
  let conn;
  const { id } = req.params;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM sintoma WHERE doenca_id = ?", [
      id,
    ]);

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
