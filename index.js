const { logOperation } = require("./utils/log");
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

    logOperation("Consulta", "Consulta realizada na tabela patogeno.");

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

      logOperation(
        "Consulta",
        `Consulta realizada para o patógeno com ID ${id}`
      );
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

    logOperation(
      "Cadastro",
      `Cadastro de patógeno: ${nome_cientifico}, ${tipo}`
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

    logOperation("Consulta", `Consulta realizada na tabela doenca.`);

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
      logOperation("Consulta", `Consulta de doença com id: ${id}`);
      res.json(rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.end();
  }
});

app.post("/api/doenca", async (req, res) => {
  let conn;
  const { CID, nomes_tecnicos, nomes_populares, patogeno } = req.body;

  try {
    conn = await pool.getConnection();

    const cidExists = await conn.query("SELECT * FROM doenca WHERE CID = ?", [
      CID,
    ]);

    if (cidExists.length > 0) {
      return res.status(409).json({
        error: "CID já existente. Não é possível inserir duplicatas.",
      });
    }

    const result = await conn.query(
      "INSERT INTO doenca (patogeno_id, CID, nomes_tecnicos) VALUES (?, ?, ?)",
      [patogeno, CID, nomes_tecnicos]
    );

    const idDoenca = result.insertId;

    if (nomes_populares && nomes_populares.length > 0) {
      const insertPromises = nomes_populares.map((nomePopular) => {
        conn.query(
          "INSERT INTO nomes_populares (doenca_id, nome) VALUES (?, ?)",
          [idDoenca, nomePopular]
        );
      });
      await Promise.all(insertPromises);
    }

    logOperation(
      "Cadastro",
      `Cadastro da doença de nome técnico ${nomes_tecnicos}, nome popular ${nomes_populares}, com patógeno ${patogeno} e CID ${CID}`
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

    logOperation(
      "Cadastro",
      `Cadastro de sintoma de nome ${nome} e nível de ocorrência ${nivel_de_ocorrencia}.`
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

    logOperation("Consulta", "Consulta realizada na tabela sintoma.");

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
    const rows = await conn.query(
      "SELECT DISTINCT nome FROM sintoma AS s ORDER BY s.nome ASC"
    );
    logOperation("Consulta", "Consulta realizada na tabela sintoma.");
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

    logOperation("Consulta", "Consulta realizada na tabela nomes_populares.");

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/log", async () => {
  logOperation("Emissão", "Emissão de Relatório PDF.");
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

app.post("/api/doenca/diagnostico", async (req, res) => {
  let conn;
  const { sintomas } = req.body;

  if (!Array.isArray(sintomas) || sintomas.length === 0) {
    return res
      .status(400)
      .json({ error: "Sintomas devem ser um array de strings." });
  }

  try {
    conn = await pool.getConnection();
    let joinConditions = "";
    let whereConditions = "";

    sintomas.forEach((sintoma, index) => {
      const alias = `s${index + 1}`;

      joinConditions += `JOIN sintoma AS ${alias} ON ${alias}.doenca_id = d.id `;
      whereConditions += `${alias}.nome = '${sintoma}' `;
      if (index < sintomas.length - 1) {
        whereConditions += "AND ";
      }
    });

    const query = `
      SELECT d.id, d.nomes_tecnicos
      FROM doenca AS d
      ${joinConditions}
      WHERE ${whereConditions}
      GROUP BY d.nomes_tecnicos
      ORDER BY d.nomes_tecnicos;
    `;

    const rows = await conn.query(query, sintomas);

    logOperation("Consulta", "Consulta Apoio ao Diagnóstico.");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
