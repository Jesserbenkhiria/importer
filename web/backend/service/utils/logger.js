import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Define `__dirname` for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the log file path
const logFilePath = path.join(__dirname, "app.log");

// Function to write log messages to file
function logToFile(message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}\n`;

  // Append log message to the file
  fs.appendFile(logFilePath, formattedMessage, (err) => {
    if (err) {
      console.error("Error writing to log file:", err);
    }
  });
}

// Override `console.log`
const originalConsoleLog = console.log;
console.log = (message, ...optionalParams) => {
  originalConsoleLog(message, ...optionalParams); // Log to the console
  logToFile(message); // Log to the file
  if (optionalParams.length > 0) {
    logToFile(optionalParams.join(" "));
  }
};

// Override `console.error`
const originalConsoleError = console.error;
console.error = (message, ...optionalParams) => {
  originalConsoleError(message, ...optionalParams); // Log to the console
  logToFile(`ERROR: ${message}`); // Log to the file with "ERROR" prefix
  if (optionalParams.length > 0) {
    logToFile(optionalParams.join(" "));
  }
};

export default {
  logToFile,
};
