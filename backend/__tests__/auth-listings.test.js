process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.FRONTEND_URL = "http://localhost:4200";

const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../app");
const Category = require("../models/Category");
const User = require("../models/User");

let mongoServer;

async function clearDatabase() {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
}

async function registerAndLogin(overrides = {}) {
  const user = {
    username: overrides.username || "Jan Testowy",
    email: overrides.email || "jan@example.com",
    password: overrides.password || "secret123",
  };

  await request(app).post("/api/auth/register").send(user).expect(201);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({ email: user.email, password: user.password })
    .expect(200);

  return {
    user,
    accessToken: loginResponse.body.accessToken,
    loginResponse,
  };
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("auth endpoints", () => {
  test("rejects registration when required fields are missing", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "missing@example.com" })
      .expect(400);

    expect(response.body.message).toBeTruthy();
  });

  test("registers a user without exposing the password", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        username: "Anna Nowak",
        email: "anna@example.com",
        password: "secret123",
      })
      .expect(201);

    expect(response.body.email).toBe("anna@example.com");
    expect(response.body.password).toBeUndefined();

    const user = await User.findOne({ email: "anna@example.com" });
    expect(user).toBeTruthy();
    expect(user.password).not.toBe("secret123");
  });

  test("logs in a user and sets refresh token cookie", async () => {
    const { loginResponse } = await registerAndLogin({
      email: "login@example.com",
    });

    expect(loginResponse.body.accessToken).toEqual(expect.any(String));
    expect(loginResponse.body.user.email).toBe("login@example.com");
    expect(loginResponse.body.user.password).toBeUndefined();
    expect(loginResponse.headers["set-cookie"].join(";")).toContain("refreshToken=");
  });

  test("rejects protected profile endpoint without access token", async () => {
    const response = await request(app).get("/api/auth/me").expect(401);

    expect(response.body.message).toBeTruthy();
  });
});

describe("listing endpoints", () => {
  test("rejects listing creation when required fields are missing", async () => {
    const { accessToken } = await registerAndLogin({
      email: "seller@example.com",
    });

    const response = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Rower" })
      .expect(400);

    expect(response.body.message).toBeTruthy();
  });

  test("creates a listing for an authenticated user", async () => {
    const { accessToken } = await registerAndLogin({
      email: "owner@example.com",
    });
    const category = await Category.create({ name: "Elektronika" });

    const response = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Telefon",
        description: "Sprawny telefon",
        price: 500,
        location: "Warszawa",
        category_id: category._id.toString(),
      })
      .expect(201);

    expect(response.body.title).toBe("Telefon");
    expect(response.body.user_id.email).toBe("owner@example.com");
    expect(response.body.category_id.name).toBe("Elektronika");
  });

  test("prevents another user from marking a listing as sold", async () => {
    const owner = await registerAndLogin({
      email: "owner2@example.com",
    });
    const stranger = await registerAndLogin({
      email: "stranger@example.com",
    });
    const category = await Category.create({ name: "Motoryzacja" });

    const listingResponse = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        title: "Skuter",
        description: "Uzywany skuter",
        price: 2500,
        category_id: category._id.toString(),
      })
      .expect(201);

    const response = await request(app)
      .post(`/api/listings/${listingResponse.body._id}/mark-sold`)
      .set("Authorization", `Bearer ${stranger.accessToken}`)
      .expect(403);

    expect(response.body.message).toBeTruthy();
  });
});
