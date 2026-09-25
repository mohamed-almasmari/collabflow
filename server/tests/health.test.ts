import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app.js";

describe("CollabFlow API", () => {
  describe("GET /api/health", () => {
    it("returns a successful API health response", async () => {
      const response = await request(app).get("/api/health").expect(200);

      expect(response.body).toEqual({
        status: "ok",
        message: "CollabFlow API is running",
      });
    });
  });

  describe("unknown routes", () => {
    it("returns 404 for an unknown API route", async () => {
      const response = await request(app)
        .get("/api/this-route-does-not-exist")
        .expect(404);

      expect(response.body).toEqual({
        message: "Route not found",
      });
    });
  });
});
