import setupLogger from "zoapp-core/helpers/logger";

// prevent jest encoding error
require("iconv-lite").encodingExists("foo"); // eslint-disable-line import/no-extraneous-dependencies

beforeAll(async () => {
  setupLogger("test");
});
