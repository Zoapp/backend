import Users from "../../src/routes/users";

describe("users", () => {
  const UPDATED_PROFILE = {
    username: "fakeUpdated",
    email: "fakeupdated@example.fr",
  };

  const OLD_PROFILE = {
    username: "fake",
    email: "fake@example.fr",
  };

  it("Should return profile", async () => {
    const context = {
      getBody: () => ({ userId: 1 }),
    };

    const controller = {
      getUsers: () => ({
        createProfile: () => ({
          avatar: "default",
          id: 1,
          ...OLD_PROFILE,
        }),
      }),
    };

    const users = new Users(controller);
    const result = await users.newProfile(context);

    expect(result).toMatchObject({
      avatar: "default",
      id: 1,
      ...OLD_PROFILE,
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

  describe("updateProfile as admin", () => {
    it("update any user by userId, since scope is admin", async () => {
      const context = {
        getScope: () => "admin",
        getBody: () => ({
          ...UPDATED_PROFILE,
        }),
        getParams: () => ({
          userId: 12345,
        }),
      };

      const controller = {
        getUsers: () => ({
          getProfile: () => ({
            ...OLD_PROFILE,
          }),
          updateProfile: (profile) => ({
            ...profile,
          }),
        }),
      };

      const users = new Users(controller);
      const result = await users.updateProfile(context);
      expect(result).toMatchObject(UPDATED_PROFILE);
    });
  });

  describe("updateProfile as owner", () => {
    it("update current user profile", async () => {
      const context = {
        getScope: () => "owner",
        getBody: () => ({
          ...UPDATED_PROFILE,
        }),
        getParams: () => ({}),
        res: { locals: { access: { user_id: 12345 } } },
      };

      const controller = {
        getUsers: () => ({
          getProfile: () => ({
            ...OLD_PROFILE,
          }),
          updateProfile: (profile) => ({
            ...profile,
          }),
        }),
      };

      const users = new Users(controller);
      const result = await users.updateProfile(context);
      expect(result).toMatchObject(UPDATED_PROFILE);
    });
    it("should return 400 when no profile is found", async () => {
      const context = {
        getScope: () => "owner",
        getBody: () => ({
          ...UPDATED_PROFILE,
        }),
        getParams: () => ({}),
        res: { locals: { access: { user_id: 12345 } } },
      };

      const controller = {
        getUsers: () => ({
          getProfile: () => false,
          updateProfile: (profile) => ({
            ...profile,
          }),
        }),
      };

      const users = new Users(controller);
      const result = await users.updateProfile(context);
      expect(result.status).toEqual(400);
    });
  });
});
