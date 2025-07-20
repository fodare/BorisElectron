import fs from "fs";
import path from "path";
import crypto from "crypto";
import { app } from "electron";

let APP_DIR = app.getAppPath();
let MASTER_PASS_FILE = path.join(APP_DIR, "/Data/password.enc");

function masterPasswordExist() {
   if (fs.existsSync(MASTER_PASS_FILE)) {
      return true;
   } else {
      return false;
   }
}

function encryptValidationToken(userPassword) {
   const algorithm = "aes-256-cbc";
   const salt = crypto.randomBytes(16);
   const iv = crypto.randomBytes(16);

   const key = crypto.pbkdf2Sync(userPassword, salt, 100_000, 32, "sha256");

   const cipher = crypto.createCipheriv(algorithm, key, iv);
   let encrypted = cipher.update("VALID", "utf8", "hex");
   encrypted += cipher.final("hex");

   return JSON.stringify({
      salt: salt.toString("hex"),
      iv: iv.toString("hex"),
      data: encrypted,
   });
}

function isPasswordValid(userPassword, salt, iv, data) {
   try {
      const key = crypto.pbkdf2Sync(
         userPassword,
         Buffer.from(salt, "hex"),
         100_000,
         32,
         "sha256"
      );
      const decipher = crypto.createDecipheriv(
         "aes-256-cbc",
         key,
         Buffer.from(iv, "hex")
      );

      let decrypted = decipher.update(data, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted === "VALID";
   } catch {
      return false;
   }
}

function writeMasterPassword(encrypted) {
   fs.mkdirSync(path.dirname(MASTER_PASS_FILE), { recursive: true });
   fs.writeFileSync(MASTER_PASS_FILE, encrypted, "utf-8");
}

function readMasterPassword() {
   const encrypted = fs.readFileSync(MASTER_PASS_FILE, "utf-8");
   return encrypted;
}

// function deleteMasterPassword() {
//    if (fs.existsSync(MASTER_PASS_FILE)) fs.unlinkSync(MASTER_PASS_FILE);
// }

export {
   masterPasswordExist,
   encryptValidationToken,
   isPasswordValid,
   writeMasterPassword,
   readMasterPassword,
};
