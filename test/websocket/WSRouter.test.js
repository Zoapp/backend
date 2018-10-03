/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { setupLogger } from "zoapp-core";
// eslint-disable-next-line
import WSRouter, {WSRouter as WSRouterBase } from "../../src/websocket";

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
  describe("handle client message", () => {
    it("should call remove channel when unsubscribe", async () => {
      const removeChannelSpy = jest.fn();
      WSRouterBase.removeChannel = removeChannelSpy.bind(WSRouter);
      const that = {};
      const ws = { channelId: "id" };
      const route = { callback: () => {} };
      const message = "unsubscribe";
      await WSRouterBase.handleClientMessage(
        that,
        ws,
        null,
        null,
        route,
        message,
      );
      expect(removeChannelSpy).toHaveBeenCalled();
    });
    it("should set channel and route when subscribe", async () => {
      const addMiddlewareRouteSpy = jest.fn();
      const that = { addMiddlewareRoute: addMiddlewareRouteSpy };
      const ws = { channelId: "id" };
      const route = { callback: () => {} };
      const message = "subscribe";
      await WSRouterBase.handleClientMessage(
        that,
        ws,
        "token",
        "routeName",
        route,
        message,
      );
      expect(addMiddlewareRouteSpy).toHaveBeenCalled();
      expect(ws).toEqual({
        channelId: null,
        route: "routeName",
        token: "token",
      });
    });
  });
});
