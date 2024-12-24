import { useNavigate, useParams } from "react-router-dom";
import { Button } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import { useState } from "react";

import Editor from "@monaco-editor/react";

import { toast } from "react-toastify";
import getToken from "../../../utils/getToken.ts";
import axiosInstance from "../../../utils/getURL.ts";
import { ResponseInterface } from "../../../interfaces/interface.ts";
import Loader from "../../components/Loader.tsx";
import { AxiosError } from "axios";
import ProblemNav from "../../components/ProblemNav.tsx";
import {
  languageEditorMap,
  languageFeToBeMap,
} from "../../../utils/constanst.ts";
import PopoverTag from "../../components/PopoverTag.tsx";
import DifficultyBadge from "../../components/DifficultyBadge.tsx";
import LanguageDropdown from "../../components/LanguageDropdown.tsx";
import { useProblemData } from "../../hooks/CustomHook.ts";

export default function Problem() {
  const { problemId } = useParams();
  const token = getToken();
  const [language, setLanguage] = useState("C++");
  const [code, setCode] = useState<string | undefined>("");

  const navigate = useNavigate();

  const { problem, loading } = useProblemData(problemId as string);

  if (loading) {
    return <Loader />;
  }

  const handleSubmit = async () => {
    try {
      const res = await toast.promise(
        axiosInstance.post<ResponseInterface<{ submissionId: number }>>(
          `/api/problems/${problemId}`,
          {
            code: code,
            language: languageFeToBeMap[language],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
        {
          pending: "Submitting...",
          success: "All test cases passed",
        },
      );
      console.log("Submit response: ", res.data);
      navigate(`/problems/${problemId}/submissions`);
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          toast.error("Please login to submit your code");
        } else {
          const errorMessage = error.response?.data?.message;
          toast.error(errorMessage);
          navigate(`/problems/${problemId}/submissions`);
        }
      }
      console.error(error);
    }
  };

  if (!problem) {
    return <div>Problem not found</div>;
  }
  return (
    <div className="d-flex flex-grow-1 bg-body-tertiary px-5 py-4">
      <div className="container-xxl d-flex justify-content-between gap-3">
        <div className="col-6 p-4 border rounded-4 round shadow-sm bg-white">
          <ProblemNav problemId={problemId as string} />
          <h3 className="mb-3 mt-3">{problem.title}</h3>
          <DifficultyBadge difficulty={problem.difficulty} />

          <PopoverTag tags={problem.tags} />

          <ReactMarkdown className="mt-3">{problem.description}</ReactMarkdown>
        </div>

        <div className="col-6 border rounded-4 round shadow-sm bg-white pb-2">
          <div className="p-4 d-flex justify-content-between">
            <Button variant="primary" onClick={() => handleSubmit()}>
              Submit
            </Button>

            <LanguageDropdown language={language} setLanguage={setLanguage} />
          </div>
          <div>
            <Editor
              height="69vh"
              language={languageEditorMap[language]}
              value={code}
              onChange={(value) => setCode(value)}
              options={{
                minimap: { enabled: false },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
