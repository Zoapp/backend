/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import chai from "chai";
import ApiError from "zoauth-server/error/ApiError";
import Admin from "../../src/routes/admin";

const { expect } = chai;

describe("admin", () => {
  describe("getParameterValue", () => {
    it("return value found in database", async () => {
      const context = {
        getParams: () => ({ name: "foo" }),
      };

      const parameters = {
        getValue: async (name) => name,
      };

      const controller = {
        getMainParameters: () => parameters,
      };

      const admin = new Admin(controller);
      const result = await admin.getParameterValue(context);

      expect(result).to.equal("foo");
    });

    it("throws an ApiError if nothing is found", async () => {
      const context = {
        getParams: () => ({ name: "foo" }),
      };

      const parameters = {
        getValue: async () => null,
      };

      const controller = {
        getMainParameters: () => parameters,
      };

      const admin = new Admin(controller);
      try {
        await admin.getParameterValue(context);
        throw new Error("an error should be return before");
      } catch (error) {
        expect(error).to.be.an.instanceof(ApiError);
        expect(error.status).to.be.equal(404);
      }
    });
  });
});
