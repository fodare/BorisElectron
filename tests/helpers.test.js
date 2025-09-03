import {
   generateUsername,
   generateUserFriendlyPassword,
} from "../Scripts/helper.js";

describe("Helpers module", () => {
   describe("generateUsername", () => {
      it("should return a non-empty username string", async () => {
         let randomUserName = null;
         try {
            randomUserName = await generateUsername();
            expect(typeof randomUserName).toBe("string");
            expect(randomUserName.length).toBeGreaterThan(0);
         } catch (error) {
            throw new Error(
               `generateUsername should return a username but it was: ${error.message}.`
            );
         }
      });
   });

   describe("generateUserFriendlyPassword", () => {
      it("should return a password with the requested length", async () => {
         let randomPassword = null;
         let expectedPasswordLength =
            Math.floor(Math.random() * (20 - 10 + 1)) + 10;

         try {
            randomPassword = await generateUserFriendlyPassword(
               expectedPasswordLength
            );
            expect(typeof randomPassword).toBe("string");
            expect(randomPassword.length).toBe(expectedPasswordLength);
         } catch (error) {
            throw new Error(
               `generateUserFriendlyPassword should return a password of length ${expectedPasswordLength} but got "${randomPassword}" with length ${randomPassword?.length}. Error: ${error.message}`
            );
         }
      });
   });
});
