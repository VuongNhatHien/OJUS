import { exec, spawn } from "child_process";
import path from "path";
import { promisify } from "node:util";
import {
  ContainerConfig,
  ExecuteInterface,
  LanguageDetail,
} from "../../interfaces";
import { CustomError } from "../../utils/error";
import { STATUS_CODE } from "../../utils/constants";

const codeFiles = "codeFiles";
const STDOUT = "stdout";
const STDERR = "stderr";
const codeDirectory = path.join(__dirname, codeFiles);

//Convert callback function to promise to use await
const execAsync = promisify(exec);

const containers: Record<string, ContainerConfig> = {
  gcc: {
    image: "gcc:latest",
    name: "gcc-container",
    id: "",
  },
  py: {
    image: "python:3.10-slim",
    name: "py-container",
    id: "",
  },
  js: {
    image: "node:16.17.0-bullseye-slim",
    name: "js-container",
    id: "",
  },
  java: {
    image: "openjdk:20-slim",
    name: "java-container",
    id: "",
  },
};

const languageDetails: Record<string, LanguageDetail> = {
  c: {
    compiledExtension: "out",
    inputFunction: null,
    compilerCmd: (id) =>
      `gcc ./${codeFiles}/${id}.c -o ./${codeFiles}/${id}.out -lpthread -lrt`,
    executorCmd: (id) => `./${codeFiles}/${id}.out`,
    container: containers.gcc,
  },
  cpp: {
    compiledExtension: "out",
    inputFunction: null,
    compilerCmd: (id) =>
      `g++ ./${codeFiles}/${id}.cpp -o ./${codeFiles}/${id}.out`,
    executorCmd: (id) => `./${codeFiles}/${id}.out`,
    container: containers.gcc,
  },
  py: {
    compiledExtension: "",
    inputFunction: (data: string) => (data ? data.split(" ").join("\n") : ""),
    compilerCmd: null,
    executorCmd: (id) => `python ./${codeFiles}/${id}`,
    container: containers.py,
  },
  js: {
    compiledExtension: "",
    inputFunction: null,
    compilerCmd: null,
    executorCmd: (id) => `node ./${codeDirectory}/${id}`,
    container: containers.js,
  },
  java: {
    compiledExtension: "class",
    inputFunction: null,
    compilerCmd: (id) =>
      `javac -d ./${codeDirectory}/${id} ./${codeDirectory}/${id}.java`,
    executorCmd: (id) => `java -cp ./${codeDirectory}/${id} Solution`,
    container: containers.java,
  },
};

/**
 * Creates a Docker container.
 * @param container - Container configuration with name and image.
 * @returns Promise<string> - Returns the container ID.
 */

const createContainer = async (container: ContainerConfig) => {
  const { name, image } = container;
  const result = await execAsync(
    `docker run -i -d --rm --mount type=bind,src="${codeDirectory}",dst=/${codeFiles} --name ${name} --label oj=oj ${image}`,
  );
  return result.stdout.trim();
};

/**
 * Get container id
 * @param container_name - The container ID or name.
 * @returns Promise<string> - Returns the container ID.
 */
const getContainerId = async (container_name: string) => {
  const running = await execAsync(
    `docker container ps --filter "name=${container_name}" --format "{{.ID}}"`,
  );
  return running.stdout.trim();
};

/**
 * Stop a running container
 * @param container_name
 */
const killContainer = async (container_name: string) => {
  await execAsync(`docker kill ${container_name}`);
};

/**
 * Create new container if not created yet
 * @param container - Container configuration with name and image.
 */
const initDockerContainer = async (container: ContainerConfig) => {
  const name = container.name;
  const container_id = await getContainerId(name);

  if (container_id) {
    await killContainer(container_id);
    console.log(`Container ${name} stopped`);
  }
  container.id = await createContainer(container);
  console.log(`Container ${name} created`);
};

/**
 * Initialize all docker from container list
 */
const initAllDockerContainers = async () => {
  await Promise.all(
    Object.values(containers).map((container) =>
      initDockerContainer(container),
    ),
  );
  console.log("\nAll containers initialized");
};

/**
 * Compiles the code inside a Docker container.
 * @param containerId - The container ID.
 * @param filename - The file name to compile.
 * @param language - The language of the file.
 * @returns Promise<string> - Returns the file ID.
 */
const compile = async (
  containerId: string,
  filename: string,
  language: string,
) => {
  const id = filename.split(".")[0];
  const command = languageDetails[language].compilerCmd
    ? languageDetails[language].compilerCmd(id)
    : null;

  if (!command) {
    return filename;
  }

  try {
    await execAsync(`docker exec ${containerId} ${command}`);
    return id;
  } catch (error: any) {
    // throw new CompileError(error.stderr);
    throw new CustomError(
      "COMPILE_ERROR",
      "Compile error!",
      STATUS_CODE.BAD_REQUEST,
      {
        stderr: error.stderr,
      },
    );
  }
};

/**
 * Executes the compiled code or code inside a Docker container.
 * @param containerId - The container ID.
 * @param filename - The file name to execute.
 * @param input - The input to pass to the program.
 * @param expectedOutput - Expected output
 * @param language - The language of the file.
 * @param onProgress - Callback for progress events.
 * @param timeLimit - Time limit
 * @returns Promise<string> - Returns the verdict
 */
const executeAgainstTestcase = async (
  containerId: string,
  filename: string,
  input: string,
  expectedOutput: string,
  language: string,
  onProgress: (data: string, type: string, pid: number) => void | null,
  timeLimit: number,
): Promise<ExecuteInterface> => {
  const command = languageDetails[language].executorCmd(filename);

  if (!command) throw new Error("Language Not Supported");

  return new Promise((resolve, reject) => {
    const cmd = spawn("docker", ["exec", "-i", `${containerId} ${command}`], {
      shell: true,
    });

    let stdout = "";
    let stderr = "";

    if (input) {
      cmd.stdin.write(input);
      cmd.stdin.end();
    }

    let isTimeout = false;
    const timeoutId = setTimeout(() => {
      isTimeout = true;
      cmd.stdout.destroy();
      cmd.kill();
    }, timeLimit);

    cmd.stdin.on("error", (err) => {
      reject(new Error(err.message));
    });

    cmd.stdout.on("data", (data) => {
      stdout += data.toString();
      if (onProgress && cmd.pid !== undefined) {
        onProgress(data.toString(), STDOUT, cmd.pid);
      }
    });

    cmd.stderr.on("data", (data) => {
      stderr += data.toString();
      if (onProgress && cmd.pid !== undefined) {
        onProgress(data.toString(), STDERR, cmd.pid);
      }
    });

    cmd.on("error", (err) => {
      reject(new Error(err.message));
    });

    //Can also use close instead of exit?
    cmd.on("exit", (exitCode) => {
      clearTimeout(timeoutId);
      if (isTimeout) {
        resolve({
          stdout: stdout,
          verdict: "TIME_LIMIT_EXCEEDED",
        });
      }
      if (exitCode !== 0) {
        reject(
          new CustomError(
            "RUNTIME_ERROR",
            `Process ${cmd.pid} exited with code ${exitCode}`,
            STATUS_CODE.BAD_REQUEST,
            {
              pid: cmd.pid,
              exitCode: exitCode,
            },
          ),
        );
      }
      if (stdout !== expectedOutput) {
        resolve({
          stdout: stdout,
          verdict: "WRONG_ANSWER",
        });
      }
      resolve({
        stdout: stdout,
        verdict: "OK",
      });
    });
  });
};

export {
  createContainer,
  compile,
  executeAgainstTestcase,
  codeDirectory,
  initAllDockerContainers,
  languageDetails,
};
