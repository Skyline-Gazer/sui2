import test from "node:test";
import assert from "node:assert/strict";

import { parseCloudflareTrace } from "../js/client-info.js";

test("parses IPv4 trace fields in any order", () => {
  assert.deepEqual(parseCloudflareTrace("loc=gb\ncolo=LHR\nip=203.0.113.42\n"), {
    ip: "203.0.113.42",
    location: "GB",
  });
});

test("preserves a compressed IPv6 address and accepts CRLF", () => {
  assert.deepEqual(parseCloudflareTrace("ip=2001:db8::42\r\nloc=US\r\n"), {
    ip: "2001:db8::42",
    location: "US",
  });
});

test("rejects traces missing either required field", () => {
  assert.equal(parseCloudflareTrace("ip=203.0.113.42\ncolo=SJC\n"), null);
  assert.equal(parseCloudflareTrace("loc=US\ncolo=SJC\n"), null);
});

test("rejects malformed IP and location values", () => {
  assert.equal(parseCloudflareTrace("ip=not-an-ip\nloc=US\n"), null);
  assert.equal(parseCloudflareTrace("ip=203.0.113.42\nloc=USA\n"), null);
});

test("rejects an HTML fallback response", () => {
  assert.equal(parseCloudflareTrace("<!doctype html><title>Not found</title>"), null);
});
