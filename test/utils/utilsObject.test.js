/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import deleteUndefined from "../../src/utils/utilsObject";

describe("utilsObject", () => {
  it("should remove undefined fields", () => {
    expect(Object.keys(deleteUndefined({ a: "a", b: [] }))).toEqual(["a", "b"]);
    expect(
      Object.keys(
        deleteUndefined({ a: "a", b: undefined, c: [], d: undefined }),
      ),
    ).toEqual(["a", "c"]);
  });
});
