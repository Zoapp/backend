import Users from "../../src/routes/users";

describe("admin", () => {
  it("Should return profile", async () => {
    const context = {
      getBody: () => ({ userId: 1 }),
    };

    const controller = {
      getUsers: () => ({
        createProfile: () => ({
          avatar: "default",
          email: "blbl@blbl.blbl",
          id: 1,
          username: "blbl",
        }),
      }),
    };

    const users = new Users(controller);
    const result = await users.newProfile(context);

    expect(result).toMatchObject({
      avatar: "default",
      email: "blbl@blbl.blbl",
      id: 1,
      username: "blbl",
    });
  });

  it("Should return error", async () => {
    const context = {
      getBody: () => ({}),
    };

    const controller = {
      getUsers: () => ({
        createProfile: () => undefined,
      }),
    };

    const users = new Users(controller);
    const result = await users.newProfile(context);

    expect(result).toMatchObject({
      error: "Can't create user profile",
      status: 400,
    });
  });
});
