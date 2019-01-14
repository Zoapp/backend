import crypto from "crypto";
import fetch from "node-fetch";

const GravatarHandler = {
  async fetchGravatar(email) {
    try {
      const response = await fetch(this.getGravatarUrl(email));
      return { url: (await response.json()).entry[0].photos[0].value };
    } catch (err) {
      return { error: "Failed fetching gravatar", status: 500 };
    }
  },
  getGravatarUrl(email, format = "json") {
    if (!["json", "xml", "php", "vcf", "qr"].includes(format)) {
      throw new Error("while fetching gravatar. Requested format not allowed");
    }
    const GRAVATAR_BASE_URL = "https://www.gravatar.com";
    const md5email = `/${crypto
      .createHash("md5")
      .update(email)
      .digest("hex")}`;
    return `${GRAVATAR_BASE_URL + md5email}.json`;
  },
};

export default GravatarHandler;
