import fs from "fs";
import path from "path";
import crypto from "crypto";
import { app } from "electron";

let APP_DIR = app.getPath("userData");
let MASTER_PASS_FILE = path.join(APP_DIR, "/Data/password.enc");
let ACCOUNTS_FILE = path.join(APP_DIR, "/Data/accounts.enc");
let TRANSACTIONS_FILE = path.join(APP_DIR, "/Data/transactions.enc")

// ---------- Master-Password control ---------- //

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

// ---------- Other encryption logic ---------- //

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

function writeAccountToFile(encryptedAccount) {
   try {
      fs.mkdirSync(path.dirname(MASTER_PASS_FILE), { recursive: true });
      let currentData = [];
      if (fs.existsSync(ACCOUNTS_FILE)) {
         const rawData = fs.readFileSync(ACCOUNTS_FILE, "utf8");
         currentData = JSON.parse(rawData);
      }
      currentData.push(encryptedAccount);
      fs.writeFileSync(
         ACCOUNTS_FILE,
         JSON.stringify(currentData, null, 3),
         "utf8"
      );

      return {
         success: true,
         message: "Wrote account to file!",
      };
   } catch (error) {
      return {
         success: false,
         message: error,
      };
   }
}

function readAccountFromFile() {
   try {
      if (!fs.existsSync(ACCOUNTS_FILE)) {
         return { success: false, data: [] };
      }

      const fileContent = fs.readFileSync(ACCOUNTS_FILE, "utf8");
      const data = JSON.parse(fileContent);

      if (!Array.isArray(data)) {
         return {
            success: false,
            error: "Malformed accounts file. Expected an array of accounts.",
         };
      }

      return { success: true, data };
   } catch (error) {
      return {
         success: false,
         error: error,
      };
   }
}

function updateAccountInFile(
   oldAccountName,
   updatedAccount,
   masterPassword,
   saltHex
) {
   const readResult = readAccountFromFile();

   if (!readResult.success) {
      return { success: false, message: "Failed to read account on file." };
   }

   const keyResult = deriveKeyFromMasterpassword(masterPassword, saltHex);
   if (!keyResult.success) {
      return { success: false, message: "Key derivation failed." };
   }

   const decryptedAccounts = readResult.data
      .map((account) => {
         const decrypted = decryptContent(
            account.iv,
            account.data,
            keyResult.data
         );
         if (!decrypted.success) return null;

         try {
            const parsed = JSON.parse(decrypted.data);
            if (!parsed || typeof parsed.name !== "string") {
               return null;
            }
            return parsed;
         } catch (err) {
            return null;
         }
      })
      .filter(Boolean);

   const accountNameExist = decryptedAccounts.some(
      (acc) => acc.name === updatedAccount.name && acc.name !== oldAccountName
   );

   if (accountNameExist) {
      return {
         success: false,
         message: `An account named "${updatedAccount.name}" already exists.`,
      };
   }

   const updatedList = decryptedAccounts.map((account) =>
      account.name === oldAccountName ? updatedAccount : account
   );

   const encryptedAccounts = updatedList.map((account) => {
      const encrypted = encryptContent(JSON.stringify(account), keyResult.data);
      if (!encrypted.success) throw new Error("Encryption failed.");
      return JSON.parse(encrypted.encryptedContent);
   });

   try {
      fs.writeFileSync(
         path.join(APP_DIR, "/Data/accounts.enc"),
         JSON.stringify(encryptedAccounts, null, 3),
         "utf8"
      );
      return { success: true, message: "Account updated successfully." };
   } catch (error) {
      return {
         success: false,
         message: `Failed to write updated accounts. ${error}`,
      };
   }
}

function deleteAccountFromFile(accountName, masterPassword, saltHex) {
   const readResult = readAccountFromFile();
   if (!readResult.success) {
      return { success: false, message: "Failed to read accounts from file." };
   }

   const keyResult = deriveKeyFromMasterpassword(masterPassword, saltHex);
   if (!keyResult.success) {
      return { success: false, message: "Failed to derive key." };
   }

   const decryptedAccounts = readResult.data
      .map((entry) => {
         const decrypted = decryptContent(entry.iv, entry.data, keyResult.data);
         if (!decrypted.success) return null;
         try {
            return JSON.parse(decrypted.data);
         } catch {
            return null;
         }
      })
      .filter(Boolean);

   const filtered = decryptedAccounts.filter((acc) => acc.name !== accountName);
   if (filtered.length === decryptedAccounts.length) {
      return { success: false, message: "Account not found." };
   }

   const encryptedAccounts = filtered.map((acc) => {
      const enc = encryptContent(JSON.stringify(acc), keyResult.data);
      if (!enc.success) throw new Error("Encryption failed.");
      return JSON.parse(enc.encryptedContent);
   });

   try {
      fs.writeFileSync(
         ACCOUNTS_FILE,
         JSON.stringify(encryptedAccounts, null, 3),
         "utf8"
      );
      return { success: true, message: "Account deleted successfully." };
   } catch (err) {
      return { success: false, message: "Failed to write file." };
   }
}

function writeTransactionToFile(encryptedTransaction) {
   try {
      fs.mkdirSync(path.dirname(TRANSACTIONS_FILE), { recursive: true });
      let currentData = [];

      if (fs.existsSync(TRANSACTIONS_FILE)) {
         const rawData = fs.readFileSync(TRANSACTIONS_FILE, "utf8");
         currentData = JSON.parse(rawData);
      }

      currentData.push(encryptedTransaction);
      fs.writeFileSync(
         TRANSACTIONS_FILE,
         JSON.stringify(currentData, null, 3),
         "utf8"
      );

      return {
         success: true,
         message: "Wrote transaction to file!",
      };
   } catch (error) {
      return {
         success: false,
         message: error,
      };
   }
}

function readTransactionsFromFile(){
   try {
      if (!fs.existsSync(TRANSACTIONS_FILE)) {
         return { success: false, data: [] };
      }

      const fileContent = fs.readFileSync(TRANSACTIONS_FILE, "utf8");
      const data = JSON.parse(fileContent);

      if (!Array.isArray(data)) {
         return {
            success: false,
            error: "Malformed transactions file. Expected an array of transactions.",
         };
      }

      return { success: true, data };
   } catch (error) {
      return {
         success: false,
         error: error
      };
   }
}

export {
   masterPasswordExist,
   encryptValidationToken,
   isPasswordValid,
   writeMasterPassword,
   readMasterPassword,
   deriveKeyFromMasterpassword,
   encryptContent,
   decryptContent,
   writeAccountToFile,
   readAccountFromFile,
   updateAccountInFile,
   deleteAccountFromFile,
   writeTransactionToFile,
   readTransactionsFromFile
};
