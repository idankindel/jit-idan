export type TScriptMetadata = {
    scriptPath: string;
    scriptName: string;
    scriptContent: string;
    readmeContent: string;
}

export type TDockerConfig = {
    baseImage: string;
    entrypoint: string[];
    execPrefix: string;
}

export type TGeneratorConfig = {
    OPENAI_API_KEY: string;
    DOCKER_BY_CODE_LANG: Record<string, TDockerConfig>
};

export type TParsedArgs = {
    scriptPath: string;
    readmePath: string;
};

export type TAnalyzeScriptResponse = {
    scriptType: string;
    scriptName: string;
    analysis: "SUCCESS" | "FAILED",
    tests: {
        inputValue: string,
        testResult: string,
        isSuccess: boolean;
    }[],
    issues: string[]
}

export type TAnalyzeScriptResults = {
    isSuccess: boolean;
} & TAnalyzeScriptResponse;

export type TDockerAndReadmeResponse = {
    dockerfileContent: string;
    readmeContent: string;
}

export type TDockerSetup = {
    outputDir: string;
    dockerfilePath: string;
    readmePath: string;
    scriptPath: string; 
};

export type TContainerResult = {
    output: string;
    exitCode: number;
    success: boolean;
}

export type TTestResult = {
    success: boolean;
    input: string;
    actualOutput: string;
    expectedOutput: string;
}
