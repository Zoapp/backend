/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import http from "http";
import url from "url";

// Heavily modfied from https://fr.godaddy.com/help/how-to-make-an-http-post-request-in-nodejs-12366
export default (urlValue, data = null, method = null) => {
  const u = url.parse(urlValue);
  let m = method;
  if ((!m) && data) {
    m = "POST";
  }
  let body = "";
  if (data) {
    body = JSON.stringify(data);
  }
  const options = {
    protocol: u.protocol,
    hostname: u.hostname,
    port: u.port,
    path: u.path,
    method: m,
    headers: { "Cache-Control": "no-cache", "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
  };
  return new Promise((resolve, reject) => {
    // console.log("fetch=", u, m, data);
    try {
      const req = http.request(options, (res) => {
        // console.log("status=", res.statusCode);
        // console.log("Headers=", JSON.stringify(res.headers));
        res.setEncoding("utf8");
        if (res.statusCode === 200) {
          const chunks = [];
          res.on("data", chunk => chunks.push(chunk));
          res.on("end", () => {
            // console.log("body=", chunks);
            let params = null;
            const bodybody = chunks.join("");
            if (bodybody) {
              params = JSON.parse(bodybody);
            }
            resolve(params);
          });
        } else {
          reject(Error(res.statusMessage));
        }
      });
      req.on("error", (e) => {
        console.log("error in request:", e.message);
        reject(e);
      });
      // write data to request body
      if (data) {
        // console.log("body=", body);
        req.write(body);
      }
      req.end();
    } catch (e) {
      console.log("error in request:", e.message);
    }
  });
};
