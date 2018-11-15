/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { setupLogger } from "zoapp-core";
import ApiError from "zoauth-server/errors/ApiError";
import UsersModel from "../../src/models/users";

jest.mock("../../src/models/abstractModel");

setupLogger("test");

describe("users - middlewares", () => {
  let usersModel = null;
  beforeAll(() => {
    usersModel = new UsersModel(null, null);
    usersModel.generateId = () => "abcd";
  });

  describe("createProfile", () => {
    it("should create a new profile", async () => {
      const newUser = {
        username: "user",
        email: "user@mail.com",
      };
      const getItemSpy = jest
        .fn()
        .mockResolvedValue(Promise.resolve())
        .mockResolvedValue(Promise.resolve())
        .mockResolvedValue(Promise.resolve());
      const setItemSpy = jest.fn().mockResolvedValue(Promise.resolve(newUser));
      const profilesModelMock = { getItem: getItemSpy, setItem: setItemSpy };
      expect(
        usersModel.createProfile(newUser, profilesModelMock),
      ).resolves.toMatchObject({ id: "abcd" });
    });

    it("should throw an error if email already exist", (done) => {
      const preexistingUser = {
        username: "foo",
        email: "foo@test.com",
      };
      // when searching for email return a preexisting profile
      const getItemSpy = jest.fn((arg) => {
        if (arg.includes("email=")) {
          return Promise.resolve(preexistingUser);
        }
        return Promise.resolve(undefined);
      });
      const setItemSpy = jest.fn().mockResolvedValue(Promise.resolve());
      const profilesModelMock = { getItem: getItemSpy, setItem: setItemSpy };
      usersModel
        .createProfile(
          { username: "bar", email: "foo@test.com" },
          profilesModelMock,
        )
        .catch((error) => {
          expect(error).toMatchObject(
            new ApiError(409, "Profile with same email already exists."),
          );
          done();
        });
    });

    it("allow to create anonymous user without email", (done) => {
      const newUser = {
        username: "user",
        email: undefined,
        anonymous: true,
      };
      const preexistingUser = {
        username: "foo",
        email: undefined,
        anonymous: true,
      };
      // when searching for email return a preexisting profile
      const getItemSpy = jest.fn((arg) => {
        if (arg.includes("email=")) {
          return Promise.resolve(preexistingUser);
        }
        return Promise.resolve(undefined);
      });
      const setItemSpy = jest.fn().mockResolvedValue(Promise.resolve(newUser));
      const profilesModelMock = { getItem: getItemSpy, setItem: setItemSpy };
      usersModel.createProfile(newUser, profilesModelMock).then((result) => {
        expect(setItemSpy).toHaveBeenCalled();
        expect(result).toMatchObject({ username: newUser.username });
        done();
      });
    });
  });
});
