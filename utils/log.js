const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

function logOperation(operation, details) {
  const logMessage = `${new Date().toISOString()} - ${operation}: ${details}\n`;
  const logFilePath = path.join(logDir, "operations.log");

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error("Erro ao registrar log:", err);
    }
  });
}

module.exports = { logOperation };
