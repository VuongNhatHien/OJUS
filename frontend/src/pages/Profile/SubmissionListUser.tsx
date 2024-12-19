import { Link, useNavigate } from "react-router-dom";

import NavBar from "../../components/NavBar.tsx";
import { Table } from "react-bootstrap";
import { useEffect, useState } from "react";

import { toast } from "react-toastify";
import getToken from "../../../utils/getToken.ts";
import {
  ResponseInterface,
  SubmissionListWithProblemResponseInterface,
} from "../../../interfaces/response.interface.ts";
import axiosInstance from "../../../utils/getURL.ts";
import { SubmissionWithProblem } from "../../../interfaces/model.interface.ts";
import Loader from "../../components/Loader.tsx";
import { AxiosError } from "axios";
import Footer from "../../components/Footer.tsx";

export default function SubmissionListUser() {
  const token = getToken(); // Get token from localStorage
  const [fetchSubmissions, setFetchSubmissions] = useState<
    SubmissionWithProblem[]
  >([]);

  const navigate = useNavigate();
  useEffect(() => {
    if (!token) {
      toast.error("You need to login to view submission");
      navigate("/accounts/login");
    }
  }, [token, navigate]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get<
          ResponseInterface<SubmissionListWithProblemResponseInterface>
        >(`/api/user/submissions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(res.data);
        setFetchSubmissions(res.data.data.submissions);
      } catch (error) {
        if (error instanceof AxiosError) {
          if (error.response?.status === 401) {
            // toast.error("You need to login to view submissions");
          } else {
            const errorMessage = error.response?.data?.message;
            toast.error(errorMessage);
          }
        }
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <Loader />;
  }

  const submissions = fetchSubmissions.map((fetchSubmission) => {
    const languageMap: Record<string, string> = {
      py: "Python",
      c: "C",
      cpp: "C++",
      java: "Java",
      js: "JavaScript",
    };

    const verdictMap: Record<string, string> = {
      OK: "Accepted",
      WRONG_ANSWER: "Wrong answer",
      TIME_LIMIT_EXCEEDED: "Time limit exceeded",
      RUNTIME_ERROR: "Runtime error",
      COMPILE_ERROR: "Compile error",
    };

    const date = new Date(fetchSubmission.createdAt);

    const readableTime = date.toLocaleString("en-US", {
      year: "numeric", // e.g., "2024"
      month: "long", // e.g., "December"
      day: "numeric", // e.g., "6"
    });

    const difficultyMapping: Record<number, string> = {
      1: "Bronze",
      2: "Platinum",
      3: "Master",
    };
    return {
      ...fetchSubmission,
      problem: {
        ...fetchSubmission.problem,
        difficulty: difficultyMapping[fetchSubmission.problem.difficulty],
      },
      verdict: verdictMap[fetchSubmission.verdict],
      language: languageMap[fetchSubmission.language],
      createdAt: readableTime,
    };
  });

  return (
    <div className="d-flex-flex-column">
      {/*<NavBar />*/}

      <div className="bg-light p-3">
        <div className="container">
          <div
            className="d-flex justify-content-between"
            style={{ minHeight: "83vh" }}
          >
            <div className="container p-4 border rounded-4 round shadow-sm bg-white">
              <h4 className="mb-4">All My Submissions</h4>
              <Table striped bordered hover className="mt-3">
                <thead>
                  <tr>
                    <th
                      className="text-center"
                      style={{
                        width: "30%",
                      }}
                    >
                      Title
                    </th>
                    <th className="text-center" style={{ width: "15%" }}>
                      Difficulty
                    </th>
                    <th className="text-center" style={{ width: "15%" }}>
                      Language
                    </th>
                    <th className="text-center" style={{ width: "15%" }}>
                      Verdict
                    </th>
                    <th className="text-center">Submit time</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr
                      key={submission.submissionId}
                      onClick={() =>
                        navigate(`/submissions/${submission.submissionId}`)
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <td className="text-center">
                        <Link
                          to={`/submissions/${submission.submissionId}`}
                          style={{
                            textDecoration: "none",
                            color: "black",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "blue")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "black")
                          }
                        >
                          {submission.problem.title}
                        </Link>
                      </td>

                      <td className="text-center">
                        <span
                          className={`badge fs-6 ${
                            submission.problem.difficulty === "Bronze"
                              ? "text-warning-emphasis"
                              : submission.problem.difficulty === "Platinum"
                                ? "text-primary"
                                : "text-danger"
                          }`}
                        >
                          {submission.problem.difficulty}
                        </span>
                      </td>

                      {/*Language*/}
                      <td className="text-center">{submission.language}</td>
                      <td className="text-center">
                        <span
                          className={
                            submission.verdict === "Accepted"
                              ? "badge text-success"
                              : "badge text-danger"
                          }
                          style={{
                            fontSize: "14px",
                          }}
                        >
                          {submission.verdict}
                        </span>
                      </td>

                      <td className="text-center">{submission.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}