import { Button, Dropdown, DropdownButton, Form, Table } from "react-bootstrap";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProblemInterface } from "../../interfaces/interface.ts";
import Loader from "../../components/Loader.tsx";
import { difficultyMapping, TagListInit, Tag } from "../../utils/constanst.ts";
import useFetch from "../../hooks/useFetch.ts";
import { splitString } from "../../utils/general.ts";

export default function ContributionList() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState("All");

  const [tags, setTags] = useState<Tag[]>(TagListInit);
  const [search, setSearch] = useState("");

  const toggleTag = (index: number) => {
    setTags((prevTags) =>
      prevTags.map((tag, i) =>
        i === index ? { ...tag, selected: !tag.selected } : tag,
      ),
    );
  };

  const handleResetTags = () => {
    setTags(TagListInit);
  };

  const { data, loading } = useFetch<{
    contributions: ProblemInterface[];
  }>("/api/contributions/", {
    includeToken: true,
  });
  const fetchContributions = data?.data.contributions;

  if (loading || !fetchContributions) {
    return <Loader />;
  }

  const Problems = fetchContributions.map((contribution) => {
    return {
      id: contribution.problemId,
      title: contribution.title,
      difficulty: difficultyMapping[contribution.difficulty] || "Unknown",
      tags: splitString(contribution.tags),
    };
  });

  const pickRandom = () => {
    const randomProblem = Problems[Math.floor(Math.random() * Problems.length)];
    navigate(`/contributions/${randomProblem.id}/description`);
  };

  const Difficulty = ["Bronze", "Platinum", "Master"];

  const getSelectedTags = () =>
    tags.filter((tag) => tag.selected).map((tag) => tag.label);

  const filteredProblems = Problems.filter(
    (problem) =>
      (problem.difficulty === difficulty || difficulty === "All") &&
      getSelectedTags().every((tag) => problem.tags.includes(tag)) &&
      problem.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="d-flex flex-grow-1 py-4 px-5">
      <div className="container-xxl">
        <div className="d-flex flex-row align-items-center gap-2">
          <DropdownButton variant="secondary" title="Difficulty">
            <div className="d-flex flex-column">
              {Difficulty.map((diff, index) => (
                <Dropdown.Item
                  key={index}
                  onClick={() => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                    difficulty === diff
                      ? setDifficulty("All")
                      : setDifficulty(diff);
                  }}
                >
                  <Button
                    variant="white"
                    className={`text-${
                      diff === "Bronze"
                        ? "warning-emphasis"
                        : diff === "Platinum"
                          ? "primary"
                          : "danger"
                    }`}
                  >
                    {diff}
                  </Button>
                  <span className="ms-4">
                    {difficulty === diff ? (
                      <img src="/done.svg" width="30" height="24" />
                    ) : null}
                  </span>
                </Dropdown.Item>
              ))}
            </div>
          </DropdownButton>

          <DropdownButton
            // key="2"
            variant="secondary"
            title="Tags"
          >
            <div
              className="mb-3"
              style={{
                width: "300px",
              }}
            >
              {tags.map((tag, index) => (
                <Button
                  variant={tag.selected ? "primary" : "light"}
                  key={index}
                  className={`badge rounded-pill m-1 ${
                    tag.selected ? "" : "text-dark"
                  } mx-1`}
                  onClick={() => toggleTag(index)}
                  style={{ cursor: "pointer" }}
                >
                  {tag.label}
                </Button>
              ))}
            </div>
            <div className="d-flex justify-content-end border-top">
              <Button
                variant="primary"
                className=" w-25 mt-3 me-2"
                onClick={() => handleResetTags()}
              >
                Reset
              </Button>
            </div>
          </DropdownButton>
          <Form>
            <Form.Control
              type=""
              placeholder="Search questions"
              className="mr-sm-2 bg-light"
              onChange={(e) => setSearch(e.target.value)}
            />
          </Form>
          <div
            className="d-flex ms-2"
            onClick={() => pickRandom()}
            style={{
              cursor: "pointer",
            }}
          >
            <img src="/random.svg" width="30" height="24" />
            <span className="ms-2">Pick Random</span>
          </div>
        </div>
        <Table striped bordered hover className="mt-3">
          <thead>
            <tr>
              <th style={{ width: "40%" }}>
                <div
                  className="d-flex justify-content-between"
                  style={{
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    alert("implement sort");
                  }}
                >
                  <span>Title</span>
                  <img src="/sort.svg" alt="React Bootstrap logo" />
                </div>
              </th>
              <th style={{ width: "40%" }}>Tags</th>
              <th className="text-center">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {/* Kiểm tra nếu không có vấn đề nào trong Problems */}
            {filteredProblems.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center">
                  <strong>No problems found</strong>
                </td>
              </tr>
            ) : (
              filteredProblems.map((problem) => (
                <tr
                  key={problem.id}
                  onClick={() =>
                    navigate(`/contributions/${problem.id}/description`)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <td>{problem.title}</td>

                  <td>
                    {problem.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="badge rounded-pill m-1 bg-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </td>

                  <td className="text-center">
                    <span
                      className={`badge fs-6 ${
                        problem.difficulty === "Bronze"
                          ? "text-warning-emphasis"
                          : problem.difficulty === "Platinum"
                            ? "text-primary"
                            : "text-danger"
                      }`}
                    >
                      {problem.difficulty}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
