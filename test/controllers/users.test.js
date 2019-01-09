import UsersModel from "../../src/models/users";
import UsersController from "../../src/controllers/users";

jest.mock("../../src/models/users");

describe("UserController", () => {
  const users = [{ id: 1, username: "blbl" }, { id: 2, username: "blbl2" }];
  const profiles = [];
  const mainController = {
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
});
