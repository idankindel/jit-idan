import { CONFIG } from './configuration/config';
import { OpenAiService } from './services/OpenAiService';
import { Utils } from './helpers/utils';
import { DockerService } from './services/DockerService';
import { TAnalyzeScriptResults, TDockerSetup, TScriptMetadata, TTestResult } from './helpers/types';

class ScriptExecuter {
    private openAiService: OpenAiService;
    private dockerService: DockerService;

    constructor() {
        this.validateEnvironment();
        this.openAiService = new OpenAiService(CONFIG.OPENAI_API_KEY);
        this.dockerService = new DockerService();
    }

    /**
     * Main execution flow for script validation
     */
    async execute(args: string[]): Promise<void> {
        try {            
            console.log('📝 Starting script analysis preparation...');
            const scriptMetadata = await this.prepareScriptAnalysis(args);
            console.log('✅ Script analysis preparation completed');

            console.log('🔍 Starting script analysis...');
            const scriptAnalysisResults = await this.analyzeScript(scriptMetadata);
            console.log('✅ Script analysis completed');

            console.log('🐳 Starting Docker environment preparation...');
            const dockerSetup = await this.prepareDockerEnvironment(scriptAnalysisResults, scriptMetadata);
            console.log('✅ Docker environment preparation completed');

            console.log('🧪 Starting test execution...');
            const testResult = await this.runTest(dockerSetup, scriptAnalysisResults, scriptMetadata);
            console.log('✅ Test execution completed');

            this.reportTestResults(testResult, scriptAnalysisResults);
            console.log('🏁 Script validation process completed');
        } catch (error) {
            console.error(error);
            this.handleError('Critical error during execution');
        }
    }

    /**
     * Validates required environment variables
     */
    private validateEnvironment(): void {
        if (!CONFIG.OPENAI_API_KEY) {
            this.handleError('Configuration error: OPENAI_API_KEY environment variable is not set');
        }
    }

    /**
     * Prepares initial script analysis data from command line arguments
     */
    private async prepareScriptAnalysis(args: string[]): Promise<TScriptMetadata> {
        const { scriptPath, readmePath } = Utils.parseArguments(args);
        const scriptName = scriptPath.split('/').pop();

        if (!scriptName) {
            this.handleError('Input validation: Script name could not be determined from path');
        }

        await Utils.validateFilePaths([scriptPath, readmePath]);

        return {
            scriptPath,
            scriptName,
            scriptContent: await Utils.readFileContent(scriptPath),
            readmeContent: await Utils.readFileContent(readmePath)
        };
    }

    /**
     * Analyzes script using OpenAI service
     */
    private async analyzeScript(analysis: TScriptMetadata): Promise<TAnalyzeScriptResults> {
        const scriptAnalysis = await this.openAiService.analyzeScript(analysis.scriptContent, analysis.scriptName, analysis.readmeContent);

        if (!scriptAnalysis.isSuccess) {
            console.error(scriptAnalysis)
            this.handleError('Analysis failed: Script analysis or test generation failed');
        }

        const dockerConfig = CONFIG.DOCKER_BY_CODE_LANG[scriptAnalysis.scriptType];
        if (!dockerConfig) {
            this.handleError(`Unsupported code language: "${scriptAnalysis.scriptType}" is not supported. Supported languages: ${Object.keys(CONFIG.DOCKER_BY_CODE_LANG).join(', ')}`);
        }

        return scriptAnalysis;
    }

    /**
     * Prepares Docker environment for testing
     */
    private async prepareDockerEnvironment(scriptAnalysis: TAnalyzeScriptResults, scriptMetadata: TScriptMetadata): Promise<TDockerSetup> {
        const dockerConfig = CONFIG.DOCKER_BY_CODE_LANG[scriptAnalysis.scriptType];
        const dockerSetup = await this.openAiService.analyzeDockerAndReadmeFiles(scriptAnalysis, dockerConfig);

        await Utils.cleanOutputDirectory();
        return await Utils.createOutputFiles(scriptMetadata.scriptPath, dockerSetup);
    }

    /**
     * Executes the test in Docker container
     */
    private async runTest(dockerSetup: TDockerSetup, scriptAnalysis: TAnalyzeScriptResults, scriptMetadata: TScriptMetadata): Promise<TTestResult> {
        const { dockerfilePath } = dockerSetup;
        const imageName = `${scriptMetadata.scriptName}-auto-image`.replace('.', '-').toLowerCase();
        const containerResults = await this.dockerService.runContainer(dockerfilePath, imageName, [scriptAnalysis.tests[0].inputValue]);

        return {
            success: Utils.cleanString(containerResults.output).includes(scriptAnalysis.tests[0].testResult),
            input: scriptAnalysis.tests[0].inputValue,
            actualOutput: containerResults.output.trim(),
            expectedOutput: scriptAnalysis.tests[0].testResult
        };
    }

    /**
     * Reports test execution results
     */
    /**
     * Reports test execution results
     */
    private reportTestResults(result: TTestResult, scriptAnalysis: TAnalyzeScriptResults): void {
        console.log(`\n📊 ${scriptAnalysis.scriptName} (${scriptAnalysis.scriptType}) - ${scriptAnalysis.analysis}`);
        
        console.log('\n🔮 Virtual Tests:');
        scriptAnalysis.tests.forEach((test, index) => {
            console.log(`  ${test.isSuccess ? '✓' : '✗'} Test #${index + 1}: ${test.inputValue} → ${test.testResult}`);
        });

        if (scriptAnalysis.issues.length > 0) {
            console.log(`⚠️  Issues found: ${scriptAnalysis.issues.length}`);
        }

        console.log('\n🚀 Actual Test Execution:');
        if (result.success) {
            console.log('✓ Test passed');
        } else {
            console.error(`✗ Test failed\n  Input: ${result.input}\n  Expected: ${result.expectedOutput}\n  Actual: ${result.actualOutput}`);
        }
    }

    /**
     * Handles errors consistently throughout the application
     */
    private handleError(context: string): never {
        console.error(context);
        process.exit(1);
    }
}

/**
 * Application entry point
 */
if (require.main === module) {
    const scriptExecuter = new ScriptExecuter();
    console.log('🚀 Starting script validation process...');
    scriptExecuter.execute(process.argv.slice(2));
}