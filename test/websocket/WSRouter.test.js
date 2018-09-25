/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { setupLogger } from "zoapp-core";
// eslint-disable-next-line
import WSRouter from "../../src/websocket";

setupLogger("test");

describe("WSRouter", () => {
  describe("add middleware route", () => {
    it("should merge WS middleware classes", () => {
      const attachMiddlewareSpy = jest.fn();
      const wsRouter = WSRouter({ server: { wss: {} } });
      wsRouter.loadExistingMiddleware = () => {};
      wsRouter.attachMiddleware = attachMiddlewareSpy;

      const testMiddleware = {
        id: "kyd29d",
        name: "websocker",
        classes: ["messenger", "bot"],
        status: "start",
        onDispatch: () => {},
      };

      wsRouter.middleware = { ...testMiddleware };
      // known classes. No need to update the middleware
      wsRouter.addMiddlewareRoute({ classes: ["messenger"] });
      expect(attachMiddlewareSpy).not.toHaveBeenCalled();
      attachMiddlewareSpy.mockClear();

      // new classes
      wsRouter.addMiddlewareRoute({ classes: ["sandbox"] });
      expect(attachMiddlewareSpy).toHaveBeenCalledWith({
        ...testMiddleware,
        classes: ["sandbox", "messenger", "bot"],
      });
      attachMiddlewareSpy.mockClear();

      // without previous middleware
      wsRouter.middleware = null;
      const newMiddleware = {
        name: "websocket",
        classes: ["messenger"],
        status: "start",
        // onDispatch,
      };
      wsRouter.addMiddlewareRoute({ classes: ["messenger", "bot"] });
      expect(attachMiddlewareSpy).toHaveBeenCalled();
      expect(attachMiddlewareSpy.mock.calls[0][0]).toMatchObject({
        ...newMiddleware,
        classes: ["messenger", "bot"],
      });
      expect(attachMiddlewareSpy.mock.calls[0][0].onDispatch).toBeDefined();
    });
  });
});
