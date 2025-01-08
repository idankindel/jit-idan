import Ajv, { JSONSchemaType } from 'ajv';
import OpenAI from 'openai';
import { TAnalyzeScriptResults, TDockerAndReadmeResponse, TDockerConfig } from '../helpers/types';
import { AjvSchema } from '../helpers/ajvSchema';
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources';
import { inputPromptValidator } from '../helpers/inputPromptValidator';

export class OpenAiService {
    private openai: OpenAI;
    private conversationHistory: Array<ChatCompletionMessageParam>;

    constructor(apiKey: string) {
        this.openai = new OpenAI({ apiKey });
        this.conversationHistory = [];
    }

    private async chat(messages: Array<ChatCompletionMessageParam> | string): Promise<OpenAI.Chat.Completions.ChatCompletion> {
        // If messages is a string, convert it to a user message
        if (typeof messages === 'string') {
            inputPromptValidator.detectPromptInjection(messages);

            this.conversationHistory.push({
                role: "user",
                content: messages,
            });
        } else {
            // If messages is an array, use it directly
            messages.forEach(({ content }: any) => {
                inputPromptValidator.detectPromptInjection(content);
            });

            this.conversationHistory = messages;
        }

        const completion = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: this.conversationHistory,
            temperature: 0.5,
        });

        // Add AI's response to history
        this.conversationHistory.push({
            role: "assistant",
            content: completion.choices[0].message.content,
        });

        return completion;
    }

    async analyzeScript(scriptContent: string, scriptName: string, readmeContent: string): Promise<TAnalyzeScriptResults> {
        inputPromptValidator.validateScriptInput(scriptContent, scriptName);
        inputPromptValidator.validateReadmeContent(readmeContent);

        const completion = await this.chat([
            {
                role: "system",
                content: "You are a script analyzer and tester."
            },
            {
                role: "user",
                content: `Analyze this script and its README, try to run the script with the usage from the README.
The script can be in any code language, for example: Python, Bash, Javscript, etc.
1. Verify the syntax of the script, go line by line and check if the syntax is correct, if not the "analysis" should be "FAILED"
2. Analayze at least 3 test cases.
3. The first test always will be the input from the README file and the output should be the same
4. For each test case execute the code step by step with specific input values and show it in the "inputValue" for each
Return the analysis as a valid JSON object with this exact structure without any other text, just the JSON object format:
{
    "scriptType": string,
    "scriptName": ${scriptName},
    "analysis": "SUCCESS" | "FAILED",
    "tests": [
        {
            "inputValue": string,
            "testResult": string
            "isSuccess": boolean 
        }
    ],
    "issues": string[]
}

Script:
\`\`\`
${scriptContent}
\`\`\`

README:
\`\`\`
${readmeContent}
\`\`\`
`
            }
        ]);

        await this.validatePromptChoices(completion.choices);

        const analyzeScriptResults = this.validateResponseResults(completion.choices[0].message.content as string, AjvSchema.analysisResponseSchema);

        const isSuccess = !analyzeScriptResults.issues.length && analyzeScriptResults.tests.every(({ isSuccess }) => isSuccess) && analyzeScriptResults.analysis === 'SUCCESS';

        return { ...analyzeScriptResults, isSuccess, scriptType: analyzeScriptResults.scriptType.toLowerCase() };
    }

    async analyzeDockerAndReadmeFiles({ scriptName, scriptType }: TAnalyzeScriptResults, dockerConfig: TDockerConfig): Promise<TDockerAndReadmeResponse> {
        inputPromptValidator.validateDockerConfig(dockerConfig);

        const { baseImage, execPrefix, entrypoint } = dockerConfig;
        
        const completion = await this.chat([
            {
                role: "system",
                content: "You are a DevOps engineer."
            },
            {
                role: "user",
                content: `Based on the script analysis, create a Dockerfile and README using these configurations:

scriptType: ${scriptType}
scriptName: ${scriptName}

Project structure:
- output/
  - ${scriptName}
  - Dockerfile
  - README.md

The Dockerfile must:
1. Use baseImage ${baseImage}
2. WORKDIR ${execPrefix}
3. COPY ${scriptName} ${execPrefix}/
4. Set permissions if needed
5. ENTRYPOINT ${entrypoint.concat(execPrefix + "/" + scriptName)}
6. The Dockerfile should run with option to get arguments from the command line

The README must:
1. README format
2. How to build and run the given Dockerfile with an example of running with argument, each argument should be with double quotes (check if can be more then one if not show only one example with one argument)

Return as a valid JSON object without any other text:
{
    "dockerfileContent": string,
    "readmeContent": string,
}`
            }
        ]);

        await this.validatePromptChoices(completion.choices);

        const dockerfileAndReadmeResults = this.validateResponseResults(completion.choices[0].message.content as string, AjvSchema.dockerAndReadmeResponseSchema);

        return dockerfileAndReadmeResults;
    }

    private validatePromptChoices = (choices: Array<ChatCompletion.Choice>) => {
        if (!choices || choices.length === 0) {
            throw new Error("OpenAI API returned no choices in the response");
        }

        // Check for finish_reason
        const choice = choices[0];

        if (choice.finish_reason === 'length') {
            throw new Error("Response was truncated due to length limits. Try reducing the input size.");
        }

        if (choice.finish_reason === 'content_filter') {
            throw new Error("Response was filtered due to content policy.");
        }

        if (!choice.message?.content) {
            throw new Error("Response content is empty");
        }
    }

    private validateResponseResults<T>(response: string, ajvSchema: JSONSchemaType<T>): T {
        let parsedResponse: T;

        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);

        // Extract content between ```json and ``` markers, if not, try to parse directly the response
        const jsonContent = jsonMatch?.length ? jsonMatch[1] : response;

        try {
            parsedResponse = JSON.parse(jsonContent);
        } catch (error) {
            console.error(error)
            throw new Error('Invalid JSON format in response');
        }


        const ajv = new Ajv();
        const validate = ajv.compile(ajvSchema);

        if (!validate(parsedResponse)) {
            console.error(validate.name, validate.errors)
            throw new Error('Invalid response structure');
        }

        return parsedResponse;
    }

}
