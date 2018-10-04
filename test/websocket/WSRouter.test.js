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
  describe("init middleware", () => {
    it("should create new middleware", () => {
      const updateMiddlewareSpy = jest.fn();
      const wsRouter = WSRouter({ server: { wss: {} } });
      wsRouter.loadExistingMiddleware = () => {};
      wsRouter.updateMiddleware = updateMiddlewareSpy;

      // without previous middleware
      wsRouter.middleware = null;
      const newMiddleware = {
        name: "websocket",
        classes: ["messenger"],
        status: "start",
        // onDispatch,
      };

      wsRouter.initMiddleware();
      // wsRouter.addMiddlewareRoute({ classes: ["messenger", "bot"] });
      expect(updateMiddlewareSpy).toHaveBeenCalled();
      expect(updateMiddlewareSpy.mock.calls[0][0]).toMatchObject(newMiddleware);
      expect(updateMiddlewareSpy.mock.calls[0][0].onDispatch).toBeDefined();
    });
  });
  describe("add middleware route", () => {
    it("should merge WS middleware classes", () => {
      const updateMiddlewareSpy = jest.fn();
      const wsRouter = WSRouter({ server: { wss: {} } });
      wsRouter.loadExistingMiddleware = () => {};
      wsRouter.updateMiddleware = updateMiddlewareSpy;

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
      expect(updateMiddlewareSpy).not.toHaveBeenCalled();
      updateMiddlewareSpy.mockClear();

      // new classes
      wsRouter.addMiddlewareRoute({ classes: ["sandbox"] });
      expect(updateMiddlewareSpy).toHaveBeenCalledWith({
        ...testMiddleware,
        classes: ["sandbox", "messenger", "bot"],
      });
      updateMiddlewareSpy.mockClear();
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
