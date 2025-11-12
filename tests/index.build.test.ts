import { describe, it, expect } from "bun:test";
import { parseCurl } from "../dist";

describe("parseCurl (production build)", () => {
  describe("basic GET request", () => {
    it("should parse simple GET request", () => {
      const result = parseCurl("curl https://api.example.com");
      expect(result).toMatchObject({
        method: "GET",
        url: "https://api.example.com",
        headers: {},
        body: null,
        form: {},
        cookies: {},
      });
    });

    it("should handle GET with query params", () => {
      const result = parseCurl("curl https://api.example.com?key=value");
      expect(result.url).toBe("https://api.example.com?key=value");
    });
  });

  describe("HTTP methods", () => {
    it("should parse POST request", () => {
      const result = parseCurl("curl -X POST https://api.example.com");
      expect(result.method).toBe("POST");
    });

    it("should parse PUT request", () => {
      const result = parseCurl("curl -X PUT https://api.example.com");
      expect(result.method).toBe("PUT");
    });

    it("should parse DELETE request", () => {
      const result = parseCurl("curl -X DELETE https://api.example.com");
      expect(result.method).toBe("DELETE");
    });

    it("should parse PATCH request", () => {
      const result = parseCurl("curl -X PATCH https://api.example.com");
      expect(result.method).toBe("PATCH");
    });

    it("should parse HEAD request", () => {
      const result = parseCurl("curl -X HEAD https://api.example.com");
      expect(result.method).toBe("HEAD");
    });

    it("should parse OPTIONS request", () => {
      const result = parseCurl("curl -X OPTIONS https://api.example.com");
      expect(result.method).toBe("OPTIONS");
    });
  });

  describe("headers", () => {
    it("should parse headers", () => {
      const result = parseCurl(
        'curl -H "Content-Type: application/json" https://api.example.com'
      );
      expect(result.headers["Content-Type"]).toBe("application/json");
    });

    it("should parse multiple headers", () => {
      const result = parseCurl(
        'curl -H "Header1: value1" -H "Header2: value2" https://api.example.com'
      );
      expect(result.headers.Header1).toBe("value1");
      expect(result.headers.Header2).toBe("value2");
    });
  });

  describe("body data", () => {
    it("should parse JSON body", () => {
      const result = parseCurl(
        'curl -X POST -H "Content-Type: application/json" -d \'{"name":"John"}\' https://api.example.com'
      );
      expect(result.body).toEqual({ name: "John" });
    });

    it("should parse string body", () => {
      const result = parseCurl(
        'curl -X POST -d "key=value" https://api.example.com'
      );
      expect(result.body).toBe("key=value");
    });
  });

  describe("authentication", () => {
    it("should parse basic auth", () => {
      const result = parseCurl("curl -u user:pass https://api.example.com");
      expect(result.auth.type).toBe("basic");
      expect(result.auth.username).toBe("user");
      expect(result.auth.password).toBe("pass");
    });

    it("should parse bearer token", () => {
      const result = parseCurl(
        'curl -H "Authorization: Bearer token123" https://api.example.com'
      );
      expect(result.auth.type).toBe("bearer");
      expect(result.auth.token).toBe("token123");
    });
  });

  describe("cookies", () => {
    it("should parse cookies", () => {
      const result = parseCurl(
        'curl -b "sessionId=abc123" https://api.example.com'
      );
      expect(result.cookies.sessionId).toBe("abc123");
    });
  });

  describe("form data", () => {
    it("should parse form data", () => {
      const result = parseCurl('curl -F "key=value" https://api.example.com');
      expect(result.form.key).toBe("value");
    });
  });

  describe("options", () => {
    it("should parse insecure flag", () => {
      const result = parseCurl("curl -k https://api.example.com");
      expect(result.options.insecure).toBe(true);
    });

    it("should parse follow redirects", () => {
      const result = parseCurl("curl -L https://api.example.com");
      expect(result.options.followRedirects).toBe(true);
    });
  });
});
