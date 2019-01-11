import UsersModel from "../../src/models/users";
import UsersController from "../../src/controllers/users";

jest.mock("../../src/models/users");

describe("UserController", () => {
  const users = [{ id: 1, username: "blbl" }, { id: 2, username: "blbl2" }];
  const profiles = [];
  const mainController = {
    authServer: { model: { setUser: () => {} } },
    getUser: async (userId) => users.find((u) => u.id === userId),
  };

  beforeEach(() => {
    UsersModel.mockClear();
  });

  it("Should create new profile", async () => {
    UsersModel.mockImplementation(() => ({
      createProfile: async (user) => {
        const profile = {
          id: Math.random(),
          username: user.username,
          email: user.email,
          creation_date: user.creation_date,
          userId: user.id,
          avatar: user.avatar || "default",
        };
        profiles.push(profile);
        return profile;
      },
    }));
    const usersController = new UsersController("Users", mainController);

    const usedUser = users[1];
    const profile = await usersController.createProfile(usedUser.id);
    expect(profile).toMatchObject({
      username: usedUser.username,
      userId: usedUser.id,
    });
  });

  it("Should not create new profile (invalid userId)", async () => {
    const usersController = new UsersController("Users", mainController);

    const userId = 3;
    const profile = await usersController.createProfile(userId);
    expect(profile).toEqual(undefined);
  });

  it("Should update a profile associated with a user", async () => {
    UsersModel.mockImplementation(() => ({
      storeProfile: async (profile) => profile,
    }));
    const setUserSpy = jest.fn();
    mainController.authServer.model = {
      setUser: setUserSpy,
    };
    const usersController = new UsersController("Users", mainController);
    const profile = {
      userId: 1,
      username: "initial",
      email: "initial@example.fr",
    };

    const profileUpdated = await usersController.updateProfile(profile);
    expect(setUserSpy).toHaveBeenCalled();
    expect(profileUpdated).toMatchObject({
      username: "initial",
      email: "initial@example.fr",
    });
  });

  it("Should update a profile associated without a user", async () => {
    UsersModel.mockImplementation(() => ({
      storeProfile: async (profile) => profile,
    }));
    const setUserSpy = jest.fn();
    mainController.authServer.model = {
      setUser: setUserSpy,
    };
    const usersController = new UsersController("Users", mainController);
    const profile = {
      username: "initial",
      email: "initial@example.fr",
    };

    const profileUpdated = await usersController.updateProfile(profile);
    expect(setUserSpy).not.toHaveBeenCalled();
    expect(profileUpdated).toMatchObject({
      username: "initial",
      email: "initial@example.fr",
    });
  });
});
