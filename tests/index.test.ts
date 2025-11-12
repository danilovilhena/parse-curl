import { describe, it, expect } from "bun:test";
import { parseCurl } from "../src/index.js";

describe("parseCurl", () => {
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

    it("should parse TRACE request", () => {
      const result = parseCurl("curl -X TRACE https://api.example.com");
      expect(result.method).toBe("TRACE");
    });

    it("should parse CONNECT request", () => {
      const result = parseCurl("curl -X CONNECT https://api.example.com");
      expect(result.method).toBe("CONNECT");
    });

    it("should infer POST from data flag", () => {
      const result = parseCurl('curl -d "data" https://api.example.com');
      expect(result.method).toBe("POST");
    });

    it("should use last method when multiple specified", () => {
      const result = parseCurl(
        "curl -X POST --request PUT https://api.example.com"
      );
      expect(result.method).toBe("PUT");
    });

    it("should handle invalid method gracefully", () => {
      const result = parseCurl("curl -X INVALID https://api.example.com");
      expect(result.method).toBe("GET");
    });
  });

  describe("headers", () => {
    it("should parse single header", () => {
      const result = parseCurl(
        'curl -H "Content-Type: application/json" https://api.example.com'
      );
      expect(result.headers).toEqual({ "Content-Type": "application/json" });
    });

    it("should parse multiple headers", () => {
      const result = parseCurl(
        'curl -H "Content-Type: application/json" -H "Authorization: Bearer token" https://api.example.com'
      );
      expect(result.headers).toEqual({
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      });
    });

    it("should handle headers with single quotes", () => {
      const result = parseCurl(
        "curl -H 'Content-Type: application/json' https://api.example.com"
      );
      expect(result.headers).toEqual({ "Content-Type": "application/json" });
    });

    it("should handle headers with unquoted values", () => {
      const result = parseCurl(
        "curl -H Content-Type:application/json https://api.example.com"
      );
      expect(result.headers).toEqual({ "Content-Type": "application/json" });
    });

    it("should handle --header flag", () => {
      const result = parseCurl(
        'curl --header "X-Custom: value" https://api.example.com'
      );
      expect(result.headers).toEqual({ "X-Custom": "value" });
    });

    it("should skip URLs in header values", () => {
      const result = parseCurl(
        'curl -H "Header: https://example.com" https://api.example.com'
      );
      expect(result.headers).not.toHaveProperty("Header");
    });
  });

  describe("request body", () => {
    it("should parse JSON body", () => {
      const result = parseCurl(
        'curl -d \'{"key":"value"}\' https://api.example.com'
      );
      expect(result.body).toEqual({ key: "value" });
    });

    it("should parse string body", () => {
      const result = parseCurl('curl -d "plain text" https://api.example.com');
      expect(result.body).toBe("plain text");
    });

    it("should parse complex JSON", () => {
      const json = '{"name":"John","age":30,"nested":{"key":"value"}}';
      const result = parseCurl(`curl -d '${json}' https://api.example.com`);
      expect(result.body).toEqual({
        name: "John",
        age: 30,
        nested: { key: "value" },
      });
    });

    it("should combine multiple data flags", () => {
      const result = parseCurl(
        'curl -d "key1=value1" -d "key2=value2" https://api.example.com'
      );
      expect(result.body).toBe("key1=value1&key2=value2");
    });

    it("should handle --data-raw flag", () => {
      const result = parseCurl(
        'curl --data-raw "data" https://api.example.com'
      );
      expect(result.body).toBe("data");
    });

    it("should handle --data-binary flag", () => {
      const result = parseCurl(
        'curl --data-binary "binary" https://api.example.com'
      );
      expect(result.body).toBe("binary");
    });

    it("should handle --data-binary with file path", () => {
      const result = parseCurl(
        'curl --data-binary "@/path/to/file.bin" https://api.example.com/upload'
      );
      expect(result.body).toBe("@/path/to/file.bin");
    });

    it("should handle --data-urlencode flag", () => {
      const result = parseCurl(
        'curl --data-urlencode "key=value" https://api.example.com'
      );
      expect(result.body).toBe("key=value");
    });

    it("should handle --data-ascii flag", () => {
      const result = parseCurl(
        'curl --data-ascii "ascii" https://api.example.com'
      );
      expect(result.body).toBe("ascii");
    });

    it("should handle empty data flag", () => {
      const result = parseCurl("curl -d https://api.example.com");
      expect(result.body).toBeNull();
    });

    it("should skip URLs in data values", () => {
      const result = parseCurl(
        'curl -d "https://example.com" https://api.example.com'
      );
      expect(result.body).toBeNull();
    });
  });

  describe("form data", () => {
    it("should parse form data", () => {
      const result = parseCurl('curl -F "key=value" https://api.example.com');
      expect(result.form).toEqual({ key: "value" });
    });

    it("should parse file uploads", () => {
      const result = parseCurl(
        'curl -F "file=@/path/to/file.jpg" https://api.example.com'
      );
      expect(result.form).toEqual({ file: "@/path/to/file.jpg" });
    });

    it("should parse multiple form fields", () => {
      const result = parseCurl(
        'curl -F "key1=value1" -F "key2=value2" https://api.example.com'
      );
      expect(result.form).toEqual({ key1: "value1", key2: "value2" });
    });

    it("should handle --form flag", () => {
      const result = parseCurl(
        'curl --form "key=value" https://api.example.com'
      );
      expect(result.form).toEqual({ key: "value" });
    });

    it("should handle form field without value", () => {
      const result = parseCurl('curl -F "key" https://api.example.com');
      expect(result.form).toEqual({ key: "" });
    });

    it("should skip URLs in form values", () => {
      const result = parseCurl(
        'curl -F "key=https://example.com" https://api.example.com'
      );
      expect(result.form).toEqual({});
    });

    it("should handle multiple file uploads", () => {
      const result = parseCurl(
        'curl -F "avatar=@/path/to/avatar.jpg" -F "document=@/path/to/doc.pdf" https://api.example.com'
      );
      expect(result.form).toEqual({
        avatar: "@/path/to/avatar.jpg",
        document: "@/path/to/doc.pdf",
      });
    });

    it("should handle mixed form fields and file uploads", () => {
      const result = parseCurl(
        'curl -F "name=John" -F "file=@/path/to/image.jpg" -F "email=john@example.com" https://api.example.com'
      );
      expect(result.form).toEqual({
        name: "John",
        file: "@/path/to/image.jpg",
        email: "john@example.com",
      });
    });
  });

  describe("authentication", () => {
    it("should parse basic auth", () => {
      const result = parseCurl(
        "curl -u username:password https://api.example.com"
      );
      expect(result.auth).toEqual({
        type: "basic",
        username: "username",
        password: "password",
        token: "",
      });
    });

    it("should parse auth without password", () => {
      const result = parseCurl("curl -u username https://api.example.com");
      expect(result.auth).toEqual({
        type: "basic",
        username: "username",
        password: "",
        token: "",
      });
    });

    it("should parse bearer token from header", () => {
      const result = parseCurl(
        'curl -H "Authorization: Bearer abc123" https://api.example.com'
      );
      expect(result.auth).toEqual({
        type: "bearer",
        username: "",
        password: "",
        token: "abc123",
      });
    });

    it("should handle digest auth", () => {
      const result = parseCurl(
        "curl --digest -u username:password https://api.example.com"
      );
      expect(result.auth.type).toBe("digest");
    });

    it("should handle --basic flag", () => {
      const result = parseCurl(
        "curl --basic -u username:password https://api.example.com"
      );
      expect(result.auth.type).toBe("basic");
    });

    it("should handle --user flag", () => {
      const result = parseCurl(
        "curl --user username:password https://api.example.com"
      );
      expect(result.auth.username).toBe("username");
      expect(result.auth.password).toBe("password");
    });

    it("should skip URLs in auth credentials", () => {
      const result = parseCurl(
        "curl -u https://example.com https://api.example.com"
      );
      expect(result.auth.username).toBe("");
    });

    it("should handle bearer token with lowercase", () => {
      const result = parseCurl(
        'curl -H "Authorization: bearer token123" https://api.example.com'
      );
      expect(result.auth.type).toBe("bearer");
      expect(result.auth.token).toBe("token123");
    });
  });

  describe("cookies", () => {
    it("should parse single cookie", () => {
      const result = parseCurl(
        'curl -b "sessionId=abc123" https://api.example.com'
      );
      expect(result.cookies).toEqual({ sessionId: "abc123" });
    });

    it("should parse multiple cookies", () => {
      const result = parseCurl(
        'curl -b "sessionId=abc123; userId=789" https://api.example.com'
      );
      expect(result.cookies).toEqual({ sessionId: "abc123", userId: "789" });
    });

    it("should handle --cookie flag", () => {
      const result = parseCurl(
        'curl --cookie "key=value" https://api.example.com'
      );
      expect(result.cookies).toEqual({ key: "value" });
    });

    it("should handle cookie without value", () => {
      const result = parseCurl('curl -b "key" https://api.example.com');
      expect(result.cookies).toEqual({ key: "" });
    });

    it("should skip URLs in cookie values", () => {
      const result = parseCurl(
        'curl -b "https://example.com" https://api.example.com'
      );
      expect(result.cookies).toEqual({});
    });
  });

  describe("options", () => {
    it("should parse --compressed flag", () => {
      const result = parseCurl("curl --compressed https://api.example.com");
      expect(result.options.compressed).toBe(true);
    });

    it("should parse --insecure flag", () => {
      const result = parseCurl("curl --insecure https://api.example.com");
      expect(result.options.insecure).toBe(true);
    });

    it("should parse -k flag", () => {
      const result = parseCurl("curl -k https://api.example.com");
      expect(result.options.insecure).toBe(true);
    });

    it("should parse --location flag", () => {
      const result = parseCurl("curl --location https://api.example.com");
      expect(result.options.followRedirects).toBe(true);
    });

    it("should parse -L flag", () => {
      const result = parseCurl("curl -L https://api.example.com");
      expect(result.options.followRedirects).toBe(true);
    });

    it("should parse --max-time", () => {
      const result = parseCurl("curl --max-time 30 https://api.example.com");
      expect(result.options.timeout).toBe(30);
    });

    it("should parse --max-time with invalid value", () => {
      const result = parseCurl(
        "curl --max-time invalid https://api.example.com"
      );
      expect(result.options.timeout).toBeNull();
    });

    it("should parse --connect-timeout", () => {
      const result = parseCurl(
        "curl --connect-timeout 10 https://api.example.com"
      );
      expect(result.options.connectTimeout).toBe(10);
    });

    it("should parse --verbose flag", () => {
      const result = parseCurl("curl --verbose https://api.example.com");
      expect(result.options.verbose).toBe(true);
    });

    it("should parse -v flag", () => {
      const result = parseCurl("curl -v https://api.example.com");
      expect(result.options.verbose).toBe(true);
    });
  });

  describe("URL extraction", () => {
    it("should extract URL from --url flag", () => {
      const result = parseCurl("curl --url https://api.example.com");
      expect(result.url).toBe("https://api.example.com");
    });

    it("should extract positional URL", () => {
      const result = parseCurl("curl https://api.example.com");
      expect(result.url).toBe("https://api.example.com");
    });

    it("should handle URL with path", () => {
      const result = parseCurl("curl https://api.example.com/v1/users");
      expect(result.url).toBe("https://api.example.com/v1/users");
    });

    it("should handle URL with query params", () => {
      const result = parseCurl(
        "curl https://api.example.com?key=value&other=test"
      );
      expect(result.url).toBe("https://api.example.com?key=value&other=test");
    });
  });

  describe("multi-line commands", () => {
    it("should handle line continuations", () => {
      const cmd = `curl \\
-H "Content-Type: application/json" \\
-d '{"key":"value"}' \\
https://api.example.com`;

      const result = parseCurl(cmd);
      expect(result.headers).toEqual({ "Content-Type": "application/json" });
      expect(result.body).toEqual({ key: "value" });
      expect(result.url).toBe("https://api.example.com");
    });

    it("should handle Windows line endings", () => {
      const cmd = 'curl \\\r\n-H "Header: value" \\\r\nhttps://api.example.com';
      const result = parseCurl(cmd);
      expect(result.headers).toEqual({ Header: "value" });
    });
  });

  describe("complex commands", () => {
    it("should parse comprehensive command", () => {
      const cmd = `curl -X POST \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer token123" \\
-d '{"name":"John","age":30}' \\
-u admin:secret \\
-b "sessionId=abc123" \\
--compressed \\
--location \\
--max-time 30 \\
https://api.example.com/v1/users`;

      const result = parseCurl(cmd);
      expect(result.method).toBe("POST");
      expect(result.url).toBe("https://api.example.com/v1/users");
      expect(result.headers).toEqual({
        "Content-Type": "application/json",
        Authorization: "Bearer token123",
      });
      expect(result.body).toEqual({ name: "John", age: 30 });
      expect(result.auth.username).toBe("admin");
      expect(result.cookies).toEqual({ sessionId: "abc123" });
      expect(result.options.compressed).toBe(true);
      expect(result.options.followRedirects).toBe(true);
      expect(result.options.timeout).toBe(30);
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      const result = parseCurl("");
      expect(result.method).toBe("GET");
      expect(result.url).toBe("");
    });

    it("should handle whitespace only", () => {
      const result = parseCurl("   ");
      expect(result.method).toBe("GET");
      expect(result.url).toBe("");
    });

    it("should handle non-string input", () => {
      // @ts-expect-error - testing invalid input
      const result = parseCurl(null);
      expect(result.method).toBe("GET");
      expect(result.url).toBe("");
    });

    it("should handle undefined input", () => {
      // @ts-expect-error - testing invalid input
      const result = parseCurl(undefined);
      expect(result.method).toBe("GET");
      expect(result.url).toBe("");
    });

    it("should handle curl.exe", () => {
      const result = parseCurl("curl.exe https://api.example.com");
      expect(result.url).toBe("https://api.example.com");
    });

    it("should handle invalid JSON gracefully", () => {
      const result = parseCurl(
        'curl -d "not valid json{[" https://api.example.com'
      );
      expect(result.body).toBe("not valid json{[");
    });

    it("should handle missing URL gracefully", () => {
      const result = parseCurl('curl -X POST -H "Header: value"');
      expect(result.method).toBe("POST");
      expect(result.url).toBe("");
      expect(result.headers).toEqual({ Header: "value" });
    });

    it("should handle command with only curl", () => {
      const result = parseCurl("curl");
      expect(result.method).toBe("GET");
      expect(result.url).toBe("");
    });
  });

  describe("browser-exported commands", () => {
    it("should handle Chrome DevTools format", () => {
      const cmd = `curl 'https://api.example.com/v1/users' \\
-H 'accept: application/json' \\
-H 'authorization: Bearer token123'`;

      const result = parseCurl(cmd);
      expect(result.url).toBe("https://api.example.com/v1/users");
      expect(result.headers.accept).toBe("application/json");
      expect(result.headers.authorization).toBe("Bearer token123");
    });
  });

  describe("special characters", () => {
    it("should handle URL with special characters", () => {
      const result = parseCurl(
        "curl https://api.example.com/path%20with%20spaces?key=value%20here"
      );
      expect(result.url).toBe(
        "https://api.example.com/path%20with%20spaces?key=value%20here"
      );
    });

    it("should handle body with special characters", () => {
      const result = parseCurl(
        'curl -d "key=value&other=test" https://api.example.com'
      );
      expect(result.body).toBe("key=value&other=test");
    });
  });

  describe("mixed flag styles", () => {
    it("should handle both short and long flags", () => {
      const result = parseCurl(
        'curl -X POST --request PUT -H "Header: value" https://api.example.com'
      );
      expect(result.method).toBe("PUT");
    });

    it("should handle -k and --insecure", () => {
      const result1 = parseCurl("curl -k https://api.example.com");
      const result2 = parseCurl("curl --insecure https://api.example.com");
      expect(result1.options.insecure).toBe(true);
      expect(result2.options.insecure).toBe(true);
    });
  });
});
