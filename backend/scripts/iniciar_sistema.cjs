// Shim multiplataforma: npm run start chama este arquivo para evitar depender
// de `python` ou `python3` no PATH do sistema. Toda a logica de inicializacao
// esta em iniciar_sistema.py; aqui so localizamos a venv e invocamos.

const { spawn } = require("child_process");
const { existsSync } = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const BACKEND = path.join(ROOT, "backend");
const ehWindows = process.platform === "win32";
const subpasta = ehWindows ? "Scripts" : "bin";
const executavel = ehWindows ? "python.exe" : "python";

const candidatos = [
  path.join(ROOT, ".venv", subpasta, executavel),
  path.join(BACKEND, ".venv", subpasta, executavel),
];

const python = candidatos.find((caminho) => existsSync(caminho));

if (!python) {
  console.error(
    "Ambiente virtual Python nao encontrado.\n" +
      "Procurado em:\n  - " +
      candidatos.join("\n  - ") +
      "\n" +
      "Crie a venv (`python -m venv .venv`) e instale backend/requirements.txt."
  );
  process.exit(1);
}

const alvo = path.join(__dirname, "iniciar_sistema.py");
const filho = spawn(python, [alvo], { stdio: "inherit", cwd: ROOT });

filho.on("exit", (code, signal) => {
  if (signal) {
    // Repassa o sinal para manter semantica Ctrl+C limpa.
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

// Garante encerramento do filho se o npm cair.
for (const s of ["SIGINT", "SIGTERM"]) {
  process.on(s, () => {
    if (!filho.killed) filho.kill(s);
  });
}
