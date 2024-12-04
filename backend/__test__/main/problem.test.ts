import { beforeEach, describe, expect, test } from "@jest/globals";
import { app } from "../../src/app";
import request from "supertest";
import jwt from "jsonwebtoken";
import {
  GetAllProblemInterface,
  GetOneProblemInterface,
  ResponseInterfaceForTest,
  SuccessResponseInterface,
} from "../../interfaces/api-interface";
import prisma from "../../prisma/client";
import { cleanDatabase } from "../test_utils";
import * as util from "node:util";
import { exec } from "child_process";
import { STATUS_CODE } from "../../utils/constants";
import { numAccept, numPending } from "../test_data";
import { UserProblemStatus } from "@prisma/client";

jest.setTimeout(60000);

let fake_token = "";

const execPromise = util.promisify(exec);
beforeEach(async () => {
  await cleanDatabase();
  await execPromise("ts-node prisma/seed.ts");

  fake_token = jwt.sign(
    { userId: 1 }, // Payload
    process.env.JWT_SECRET as string, // Secret
    { expiresIn: "3m" }, // Token expiration
  );
});

describe("Get problem list", () => {
  test("No account", async () => {
    const res = (await request(app).get(
      "/api/problems/no-account",
    )) as ResponseInterfaceForTest<
      SuccessResponseInterface<GetAllProblemInterface>
    >;
    expect(res.status).toBe(200);
    const problems = res.body.data.problems;
    expect(problems.length).toBe(numAccept);
    problems.map((problem) => {
      expect(problem.status).toBe(2);
    });
  });
  test("With account", async () => {
    const userProblemStatusData1: UserProblemStatus = {
      userProblemStatusId: 1,
      userId: 1,
      problemId: 7,
      createdAt: new Date(),
    };
    const userProblemStatusData2: UserProblemStatus = {
      userProblemStatusId: 2,
      userId: 1,
      problemId: 9,
      createdAt: new Date(),
    };
    await prisma.userProblemStatus.upsert({
      where: { userProblemStatusId: 1 },
      update: userProblemStatusData1,
      create: userProblemStatusData1,
    });
    await prisma.userProblemStatus.upsert({
      where: { userProblemStatusId: 2 },
      update: userProblemStatusData2,
      create: userProblemStatusData2,
    });
    const res = (await request(app)
      .get("/api/problems/with-account")
      .set(
        "Authorization",
        `Bearer ${fake_token}`,
      )) as ResponseInterfaceForTest<
      SuccessResponseInterface<GetAllProblemInterface>
    >;
    expect(res.status).toBe(200);
    const problems = res.body.data.problems;
    expect(problems.length).toBe(numAccept);
    problems.map((problem) => {
      expect(problem.status).toBe(2);
      if (problem.problemId === 7 || problem.problemId === 9) {
        expect(problem.userStatus).toBe(true);
      } else {
        expect(problem.userStatus).toBe(false);
      }
    });
  });
});

// describe("Get one problem", () => {
//   test("No account", async () => {
//     const problemId = 1;
//     const res = (await request(app).get(
//       `/api/problems/no-account/${problemId}`,
//     )) as ResponseInterfaceForTest<
//       SuccessResponseInterface<GetOneProblemInterface>
//     >;
//     expect(res.status).toBe(200);
//     const problem = res.body.data.problem;
//     expect(problem.problemId).toBe(problemId);
//     expect(problem.status).toBe(2);
//     expect(problem.userStatus).toBe(0);
//   });
//   test("With account", async () => {
//     const userProblemStatusData1: UserProblemStatus = {
//       userProblemStatusId: 1,
//       userId: 1,
//       problemId: 7,
//       createdAt: new Date(),
//     };
//     const userProblemStatusData2: UserProblemStatus = {
//       userProblemStatusId: 2,
//       userId: 1,
//       problemId: 9,
//       createdAt: new Date(),
//     };
//     await prisma.userProblemStatus.upsert({
//       where: { userProblemStatusId: 1 },
//       update: userProblemStatusData1,
//       create: userProblemStatusData1,
//     });
//     await prisma.userProblemStatus.upsert({
//       where: { userProblemStatusId: 2 },
//       update: userProblemStatusData2,
//       create: userProblemStatusData2,
//     });
//     const res = (await request(app)
//       .get("/api/problems/with-account")
//       .set(
//         "Authorization",
//         `Bearer ${fake_token}`,
//       )) as ResponseInterfaceForTest<
//       SuccessResponseInterface<GetAllProblemInterface>
//     >;
//     expect(res.status).toBe(200);
//     const problems = res.body.data.problems;
//     expect(problems.length).toBe(numAccept);
//     problems.map((problem) => {
//       expect(problem.status).toBe(2);
//       if (problem.problemId === 7 || problem.problemId === 9) {
//         expect(problem.userStatus).toBe(true);
//       }
//     });
//   });
// });
