import { JSONSchemaType } from 'ajv';
import { TAnalyzeScriptResponse, TDockerAndReadmeResponse } from './types';

export namespace AjvSchema {

    export const analysisResponseSchema: JSONSchemaType<TAnalyzeScriptResponse> = {
        type: 'object',
        properties: {
            scriptType: { type: 'string' },
            scriptName: { type: 'string' },
            analysis: { 
                type: 'string',
                enum: ['SUCCESS', 'FAILED']
            },
            tests: { 
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        inputValue: { type: 'string' },
                        testResult: { type: 'string' },
                        isSuccess: { type: 'boolean' },
                    },
                    required: ['inputValue', 'testResult', 'isSuccess'],
                    additionalProperties: false
                }
            },
            issues: {
                type: 'array',
                items: { type: 'string' }
            }
        },
        required: ['scriptType', 'scriptName', 'analysis', 'tests', 'issues'],
        additionalProperties: false
    };

    export const dockerAndReadmeResponseSchema: JSONSchemaType<TDockerAndReadmeResponse> = { 
        type: 'object',
        properties: {
            dockerfileContent: { type: 'string' },
            readmeContent: { type: 'string' },        
        },
        required: ['dockerfileContent', 'readmeContent'],
        additionalProperties: false

    }

    
}