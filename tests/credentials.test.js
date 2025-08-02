jest.mock("electron", () => ({
   app: {
      getAppPath: () => "/mock/path",
   },
}));

jest.mock("fs", () => {
   const actualFs = jest.requireActual("fs");
   return {
      ...actualFs,
      existsSync: jest.fn(),
      mkdirSync: jest.fn(),
      writeFileSync: jest.fn(),
      readFileSync: jest.fn(),
   };
});

const fs = require("fs");
import {
   masterPasswordExist,
   encryptValidationToken,
   isPasswordValid,
   writeMasterPassword,
   readMasterPassword,
} from "../Scripts/credentials.js";

describe("Credentials module", () => {
   describe("masterPasswordExist", () => {
      it("returns true if file exists", () => {
         fs.existsSync.mockReturnValue(true);
         let result = null;
         try {
            result = masterPasswordExist();
            expect(result).toBe(true);
         } catch (error) {
            throw new Error(
               `masterPasswordExist is expected to return true if master-password file exists but it was: ${error.message}.`
            );
         }
      });

      it("returns false if file does not exist", () => {
         fs.existsSync.mockReturnValue(false);
         let result = null;
         try {
            result = masterPasswordExist();
            expect(result).toBe(false);
         } catch (error) {
            throw new Error(
               `masterPasswordExist is expected to return false if master-password file does not exists but it was: ${error.message}`
            );
         }
      });

      it("returns false if fs.existsSync throws error", () => {
         fs.existsSync.mockImplementation(() => {
            throw new Error("mock error");
         });
         let result = null;
         try {
            result = masterPasswordExist();
            expect(result).toBe(false);
         } catch (error) {
            throw new Error(
               `masterPasswordExist is expected to return false if "fs.existsSync" throws an error but it was: ${error.message}`
            );
         }
      });
   });

   describe("encryptValidationToken", () => {
      it("returns a stringified token containing salt, iv, data", () => {
         try {
            const encrypted = encryptValidationToken("secret");
            const parsed = JSON.parse(encrypted);
            expect(parsed).toHaveProperty("salt");
            expect(parsed).toHaveProperty("iv");
            expect(parsed).toHaveProperty("data");
         } catch (error) {
            throw new Error(
               `encryptValidationToken response is expected to contain an iv, a salt and encrypted data field but it was ${error.message}`
            );
         }
      });
   });

   describe("isPasswordValid", () => {
      let dummyPassword = "secret";
      it("returns true for correct password", () => {
         let result = null;
         try {
            const encrypted = encryptValidationToken(dummyPassword);
            const { salt, iv, data } = JSON.parse(encrypted);
            result = isPasswordValid(dummyPassword, salt, iv, data);
            expect(result).toBe(true);
         } catch (error) {
            throw new Error(
               `isPasswordValid is expected to return true when correct password is presented but it was: ${error.message}`
            );
         }
      });

      it("returns false for wrong password", () => {
         let result = null;
         try {
            const encrypted = encryptValidationToken(dummyPassword);
            const { salt, iv, data } = JSON.parse(encrypted);
            result = isPasswordValid("wrong", salt, iv, data);
            expect(result).toBe(false);
         } catch (error) {
            throw new Error(
               `isPasswordValid is expected to return false when a wrong password is presented but it was: ${error.message}`
            );
         }
      });
   });

   describe("writeMasterPassword + readMasterPassword", () => {
      it("writes and reads encrypted master password", () => {
         const dummyEncrypted = "12345";
         fs.mkdirSync.mockImplementation(() => {});
         fs.writeFileSync.mockImplementation(() => {});
         fs.readFileSync.mockReturnValue(dummyEncrypted);

         writeMasterPassword(dummyEncrypted);
         expect(fs.mkdirSync).toHaveBeenCalled();
         expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.any(String),
            dummyEncrypted,
            "utf-8"
         );

         const result = readMasterPassword();
         expect(fs.readFileSync).toHaveBeenCalled();
         expect(result).toBe(dummyEncrypted);
      });
   });
});
