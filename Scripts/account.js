import fs from "fs";
import path from "path";
import crypto from "crypto";
import { app } from "electron";

let APP_DIR = app.getAppPath();
let ACCOUNTS_FILE = path.join(APP_DIR, "/Data/accounts.json");

function deriveKey(password, salt) {
   return crypto.pbkdf2Sync(password, salt, 100_000, 32, "sha256");
}

function encryptMessage(message, password) {
   const salt = crypto.randomBytes(16);
   const iv = crypto.randomBytes(16);
   const key = deriveKey(password, salt);

   const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
   let encrypted = cipher.update(message, "utf8", "hex");
   encrypted += cipher.final("hex");

   return {
      salt: salt.toString("hex"),
      iv: iv.toString("hex"),
      data: encrypted,
      createdAt: new Date().toISOString(),
   };
}

function decryptMessage(encryptedObj, password) {
   const { salt, iv, data } = encryptedObj;
   const key = deriveKey(password, Buffer.from(salt, "hex"));
   const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      key,
      Buffer.from(iv, "hex")
   );

   let decrypted = decipher.update(data, "hex", "utf8");
   decrypted += decipher.final("utf8");
   return decrypted;
}

function saveMessage(message, password) {
   const encrypted = encryptMessage(message, password);

   let messages = [];
   if (fs.existsSync(ACCOUNTS_FILE)) {
      messages = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, "utf-8"));
   }

   messages.push(encrypted);
   fs.mkdirSync(path.dirname(ACCOUNTS_FILE), { recursive: true });
   fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(messages, null, 2), "utf-8");
}

function readAllMessages(password) {
   if (!fs.existsSync(ACCOUNTS_FILE)) return [];

   const encryptedMessages = JSON.parse(
      fs.readFileSync(ACCOUNTS_FILE, "utf-8")
   );
   return encryptedMessages.map((msg) => {
      try {
         return {
            text: decryptMessage(msg, password),
            createdAt: msg.createdAt,
         };
      } catch {
         return { error: "Decryption failed", createdAt: msg.createdAt };
      }
   });
}

export { saveMessage, readAllMessages };
