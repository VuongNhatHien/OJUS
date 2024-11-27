import { Link, useParams } from "react-router-dom";

import NavBar from "../components/NavBar";
import { Button, OverlayTrigger, Popover } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { useEffect } from "react";
import getURL from "../../utils/getURL";
import getToken from "../../utils/getToken";
import axios from 'axios';

// import SyntaxHighlighter from "react-syntax-highlighter";
// import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
// import Editor from "react-simple-code-editor";
// import Prism from "prismjs";
// import "prismjs/themes/prism.css"; // Choose a Prism theme you like

// // Load the language you need
// import "prismjs/components/prism-javascript";

// import CodeMirror from "@uiw/react-codemirror";
// import { vscodeDark } from "@uiw/codemirror-theme-vscode";

import CodeEditor from "@uiw/react-textarea-code-editor";
import rehypePrism from "rehype-prism-plus";

export default function Contribution() {

  //Check if user is logged in
  const token = getToken();


  const { id, page } = useParams();

  useEffect(() => {
    console.log("Updated id:", id);
    console.log("Updated page:", page);
  }, [id, page]);


  const tags: string[] = [
    "Array",
    "String",
    "Hash Table",
    "Dynamic Programming",
    "Math",
    "Sorting",
    "Greedy",
    "Depth-First Search",
    "Database",
    "Binary Search",
    "Matrix",
    "Tree",
    "Breadth-First Search",
  ];

  const popover = (
    <Popover id="popover-basic">
      <Popover.Header as="h3">Topics</Popover.Header>
      <Popover.Body>
        <div className="mb-3">
          {tags.map((tag, index) => (
            <span
              key={index}
              className={`badge rounded-pill bg-grey text-dark m-1 mx-1`}
            >
              {tag}
            </span>
          ))}
        </div>
      </Popover.Body>
    </Popover>
  );

  const [code, setCode] = useState("");
  // const highlightCode = (code: string) =>
  //   Prism.highlight(code, Prism.languages.javascript, "javascript");

  const [problem, setProblem] = useState(null);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const response = await fetch(getURL(`/api/contributes/${id}`), {
          headers: { Authorization: "Bearer " + token },
        }); 
        
        // Gọi API lấy dữ liệu problem
        if (!response.ok) {
          throw new Error('Lỗi khi tải dữ liệu');
        }
        const data = await response.json();
        setProblem(data.data.contribute); // Lưu dữ liệu vào state  
      } catch (error) {
      } finally {
      }
    };

    fetchProblem();
  }, [id]);

  console.log(problem);

  const Visible = {
    title : "TITLE",
    difficulty : "Easy",
    description : "Description",
    tags: ["Array", "Dynamic Programming"],
  };

  if(problem){
    Visible.title = problem.title;
    Visible.difficulty = 
    problem.difficulty === 1 ? "Easy" : 
    problem.difficulty === 2 ? "Medium" : 
    problem.difficulty === 3 ? "Hard" : "Unknown";
    Visible.tags = problem.tags.split(',');
    Visible.description = problem.description;
  };

  const handleAccept = async () => {
    try {
      const response = await axios.post(
        getURL(`/api/contributes/accept/${id}`), // URL
        {}, // Payload body (bỏ trống nếu không cần gửi thêm dữ liệu)
        {   // Config object
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
  
      console.log("Accept response:", response.data);
      alert("Contribution accepted successfully!");
    } catch (error) {
      console.error("Error accepting contribution:", error);
      alert("Failed to accept contribution. Please try again.");
    }
  };

  const handleReject = async () => {
    try {
      const response = await axios.post(
        getURL(`/api/contributes/reject/${id}`), // URL
        {}, // Payload body (bỏ trống nếu không cần gửi thêm dữ liệu)
        {   // Config object
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
  
      console.log("Reject response:", response.data);
      alert("Contribution rejected successfully!");
    } catch (error) {
      console.error("Error rejecting contribution:", error);
      alert("Failed to reject contribution. Please try again.");
    }
  };

  
  const markdown = `
Given an input string \`s\` and a pattern \`p\`, implement regular expression matching with support for \`'.'\` and \`'*'\` where:

- \`'.'\` Matches any single character.
- \`'*'\` Matches zero or more of the preceding element.

The matching should cover the **entire** input string (not partial).

#### Example 1:
- **Input:** \`s = "aa"\`, \`p = "a"\`
- **Output:** \`false\`
- **Explanation:** \`"a"\` does not match the entire string \`"aa"\`.

#### Example 2:
- **Input:** \`s = "aa"\`, \`p = "a*"\`
- **Output:** \`true\`
- **Explanation:** \`'*'\` means zero or more of the preceding element, \`'a'\`. Therefore, by repeating \`'a'\` once, it becomes \`"aa"\`.

#### Example 3:
- **Input:** \`s = "ab"\`, \`p = ".*"\`
- **Output:** \`true\`
- **Explanation:** \`".*"\` means "zero or more (\`*\`) of any character (\`.\`)".

#### Constraints:
- \`1 <= s.length <= 20\`
- \`1 <= p.length <= 20\`
- \`s\` contains only lowercase English letters.
- \`p\` contains only lowercase English letters, \`'.'\`, and \`'*'\`.
- It is guaranteed for each appearance of the character \`'*'\`, there will be a previous valid character to match.
`;

  return (
    <div className="d-flex-flex-column">
      <NavBar />
      <div
        className="d-flex gap-2"
        style={{
          position: "absolute",
          top: "10px", // Adjust this value to position vertically
          right: "50%",
          transform: "translateX(+50%)",
          zIndex: 10,
        }}
      >
        <Button variant="danger" onClick={handleReject}>Reject</Button>
        <Button>Submit</Button>
        <Button variant="success" onClick={handleAccept}>Accept</Button>
      </div>

      <div className="bg-light">
        <div className="d-flex container">
          <div
            className="container"
            style={{
              marginRight: "-15px",
            }}
          >
            <div className="border rounded bg-white mt-2">
              <div className="container border-bottom p-2 ps-3 d-flex gap-2">
                <Link
                  to={`/contributions/${id}/description`}
                  style={{
                    color: "black",
                    textDecoration: "none",
                  }}
                >
                  Description
                </Link>
                <span className="text-body-tertiary ">|</span>
                <Link
                  to={`/contributions/${id}/submissions`}
                  style={{
                    color: "black",
                    textDecoration: "none",
                  }}
                >
                  Submissions
                </Link>
              </div>

              {page === "description" ? (
                <div
                  className="container p-3"
                  style={{
                    height: "85vh", // Adjust this height as needed
                    overflowY: "auto",
                  }}
                >
                  <h3 className="mb-3">
                    {id}. {Visible.title}
                  </h3>
                  <span
                    className={`badge bg-grey me-2 ${
                      Visible.difficulty === "Easy"
                        ? "text-success"
                        : Visible.difficulty === "Medium"
                          ? "text-warning"
                          : "text-danger"
                    }`}
                  >
                    {Visible.difficulty}
                  </span>

                  <OverlayTrigger
                    trigger="hover"
                    placement="right"
                    overlay={popover}
                  >
                    <span
                      className="badge text-dark bg-grey"
                      style={{
                        cursor: "pointer",
                      }}
                    >
                      Topics
                    </span>
                  </OverlayTrigger>

                  <ReactMarkdown className="mt-3">{Visible.description}</ReactMarkdown>
                </div>
              ) : (
                <div
                  className="container p-3"
                  style={{
                    height: "85vh", // Adjust this height as needed
                    overflowY: "auto",
                  }}
                >
                  <h3>Submission</h3>
                </div>
              )}
            </div>
          </div>
          <div className="container">
            <div className="border rounded bg-white mt-2">
              <div className="container border-bottom p-2 ps-3 d-flex gap-2">
                <span>Code</span>
              </div>
              <div
                className="container p-3"
                style={{
                  height: "85vh", // Adjust this height as needed
                  overflowY: "auto",
                }}
              >
                {/* <Form.Control
                  style={{
                    border: "none",
                    boxShadow: "none",
                    resize: "none",
                  }}
                  //   placeholder="Write your description in markdown"
                  className=""
                  as="textarea"
                  rows={26}
                  //   value={code}
                  onChange={(e) => setCode(e.target.value)}
                /> */}
                {/* <Editor
                  value={code}
                  onValueChange={(code) => setCode(code)}
                  highlight={highlightCode}
                  className="custom-editor"
                  padding={10}
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 14,
                    // backgroundColor: "#f5f5f5",
                    // borderRadius: "5px",
                    // border: "none",
                    // outline: "none",
                    height: "100%",
                    // maxWidth: "90%",
                  }}
                /> */}
                <CodeEditor
                  value={code}
                  language="js"
                  // placeholder="Please enter JS code."
                  onChange={(evn) => setCode(evn.target.value)}
                  rehypePlugins={[
                    [
                      rehypePrism,
                      { ignoreMissing: true, showLineNumbers: true },
                    ],
                  ]}
                  style={{
                    // overflowY: "auto",
                    minHeight: "100%",
                    backgroundColor: "white",
                    fontSize: 16,
                    fontFamily:
                      "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
                  }}
                />
              </div>
            </div>

            {/* <SyntaxHighlighter language="javascript" style={docco}>
              {code}
            </SyntaxHighlighter> */}
            {/* <SyntaxHighlighter
              language="javascript"
              style={docco}
              showLineNumbers
              wrapLongLines
            >
              {code}
            </SyntaxHighlighter> */}
          </div>
        </div>
      </div>
    </div>
  );
}
