import fs from "fs";
import path from "path";
import crypto from "crypto";
import { app } from "electron";

let APP_DIR = app.getAppPath();
let MASTER_PASS_FILE = path.join(APP_DIR, "/Data/password.enc");

// Master-Password control

function masterPasswordExist() {
   try {
      return fs.existsSync(MASTER_PASS_FILE);
   } catch (error) {
      return false;
   }
}

function encryptValidationToken(userPassword) {
   try {
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
   } catch (error) {
      return { success: false, error: "Failed to encrypt validation token." };
   }
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

// Other encryption logic

function deriveKeyFromMasterpassword(masterPassword, saltHex) {
   try {
      const key = crypto.pbkdf2Sync(
         masterPassword,
         Buffer.from(saltHex, "hex"),
         100_000,
         32,
         "sha256"
      );
      return { success: true, data: key };
   } catch (error) {
      return {
         success: false,
         error: error,
      };
   }
}

function encryptContent(content, key) {
   try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
      let encrypted = cipher.update(content, "utf8", "hex");
      encrypted += cipher.final("hex");
      return {
         success: true,
         encryptedContent: JSON.stringify({
            iv: iv.toString("hex"),
            data: encrypted,
         }),
      };
   } catch (error) {
      return {
         success: false,
         error: error,
      };
   }
}

function decryptContent(iv, data, key) {
   try {
      const decipher = crypto.createDecipheriv(
         "aes-256-cbc",
         key,
         Buffer.from(iv, "hex")
      );

      let decryptedContent = decipher.update(data, "hex", "utf8");
      decryptedContent += decipher.final("utf8");

      return {
         success: true,
         data: decryptedContent,
      };
   } catch (error) {
      return {
         success: false,
         error: error,
      };
   }
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
   deriveKeyFromMasterpassword,
   encryptContent,
   decryptContent,
};
