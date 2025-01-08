import Docker from 'dockerode';
import path from 'path';
import fs from 'fs';
import { TContainerResult } from '../helpers/types';

export class DockerService {
    private docker: Docker;

    constructor() {
        this.docker = new Docker();
    }

    async runContainer(dockerfilePath: string, imageName: string, input: string[]): Promise<TContainerResult> {
        try {
            await this.buildImage(dockerfilePath, imageName);
            const containerOutput = await this.runAndGetOutput(imageName, input);

            return containerOutput;
        } catch (error) {
            console.error('Failed to run container');
            throw error;
        }
    }

    private async buildImage(dockerfilePath: string, imageName: string): Promise<void> {
        const buildContext = path.dirname(dockerfilePath);
        const files = fs.readdirSync(buildContext);

        const stream = await this.docker.buildImage(
            { context: buildContext, src: files },
            { t: imageName }
        );

        await this.waitForBuild(stream);
    }

    private async waitForBuild(stream: NodeJS.ReadableStream): Promise<any> {
        return new Promise((resolve, reject) => {
            this.docker.modem.followProgress(
                stream,
                (err, result) => err ? reject(err) : resolve(result),
                (event) => {
                    if (event.stream?.trim()) {
                        console.log('Build:', event.stream.trim());
                    }
                }
            );
        });
    }

    private async runAndGetOutput(imageName: string, input: string[]): Promise<TContainerResult> {
        const container = await this.docker.createContainer({
            Image: imageName,
            Cmd: input,
            AttachStdout: true,
            AttachStderr: true
        });

        await container.start();
        const { StatusCode: exitCode } = await container.wait();

        const logs = await container.logs({ stdout: true, stderr: true });

        await this.cleanupContainer(container);

        const output = logs.toString('utf8').trim();

        return {
            output,
            exitCode,
            success: exitCode === 0
        };
    }

    private async cleanupContainer(container: Docker.Container): Promise<void> {
        try {
            await container.remove();
        } catch (error) {
            console.warn('Failed to remove container', error);
        }
    }
}