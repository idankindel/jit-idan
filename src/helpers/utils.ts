import { copy, ensureDir, pathExists, readFile, remove, writeFile } from 'fs-extra';
import { TDockerAndReadmeResponse, TDockerSetup, TParsedArgs } from './types';
import path from 'path';


export namespace Utils {

    export const parseArguments = (args: string[]): TParsedArgs => {
        const scriptPath = args[0];
        const readmePath = args[1];

        if (!scriptPath || !readmePath) {
            throw new Error('Script path and Readme path are required');
        }

        return { scriptPath, readmePath };
    }

    export const readFileContent = async (filePath: string): Promise<string> => {
        try {
            const fileContent = await readFile(filePath, 'utf8');

            return fileContent;
        } catch (error) {
            console.error(`Error reading file ${filePath}:`);
            throw error;
        }
    }

    export const validateFilePaths = async (filePaths: string[]) => {
        try {
            if (!filePaths || filePaths.length === 0) {
                throw new Error('No file paths provided');
            }

            for (const filePath of filePaths) {
                const isFileExists = await pathExists(filePath);

                if (!isFileExists) {
                    throw new Error(`File does not exist: ${filePath}`);
                }
            }

            return { isValid: true };
        } catch (error) {
            throw new Error(`Error validating files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    export const createOutputFiles = async (scriptPath: string, dockerAndReadmeFiles: TDockerAndReadmeResponse): Promise<TDockerSetup> => {
        try {
            // Create base output directory
            const outputDir = path.join(process.cwd(), 'output');
            await ensureDir(outputDir);

            // Copy the original script to the script directory
            const scriptFileName = path.basename(scriptPath);
            const newScriptPath = path.join(outputDir, scriptFileName);
            await copy(scriptPath, newScriptPath);

            // Create Dockerfile
            const dockerfilePath = path.join(outputDir, 'Dockerfile');
            await writeFile(dockerfilePath, dockerAndReadmeFiles.dockerfileContent);

            // Create README
            const readmePath = path.join(outputDir, 'README.md');
            await writeFile(readmePath, dockerAndReadmeFiles.readmeContent);

            return {
                outputDir,
                dockerfilePath,
                readmePath,
                scriptPath: newScriptPath
            };
        } catch (error) {
            console.error(error);
            throw new Error('Error creating output files');
        }
    }

    export const cleanOutputDirectory = async (outputPath: string = path.join(process.cwd(), 'output')): Promise<void> => {
        try {
            const exists = await pathExists(outputPath);
            if (exists) {
                await remove(outputPath);
            }
        } catch (error) {
            console.error(error);
            throw new Error('Error cleaning output directory');
        }
    }

    export const cleanString = (text: string): string => text
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove hidden chars
        .replace(/['"]/g, '')                   // Remove quotes
        .replace(/\s+/g, ' ')                   // Replace multiple spaces with single space
        .trim();                                // Remove spaces from start and end

}