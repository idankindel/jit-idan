import dotenv from 'dotenv';
import path from 'path';
import { TGeneratorConfig } from '../helpers/types';

const result = dotenv.config({ path: path.resolve(__dirname, '../../.env') });

if (result.error) {
    console.error('Error loading .env file:', result.error);
}

export const CONFIG: TGeneratorConfig = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    DOCKER_BY_CODE_LANG: {
        "bash": {
          baseImage: "debian:stable-slim",
          entrypoint: ["/bin/bash"],
          execPrefix: "/app"
        },
        "python": {
          baseImage: "python:3-slim",
          entrypoint: ["python"],
          execPrefix: "/app"
        },
        "node.js": {
          baseImage: "node:slim",
          entrypoint: ["node"],
          execPrefix: "/app"
        },
        "javascript": {
          baseImage: "node:slim",
          entrypoint: ["node"],
          execPrefix: "/app"
        },
        "go": {
          baseImage: "golang:alpine",
          entrypoint: ["./"],
          execPrefix: "/app"
        },
        "ruby": {
          baseImage: "ruby:slim",
          entrypoint: ["ruby"],
          execPrefix: "/app"
        },
        "php": {
          baseImage: "php:cli",
          entrypoint: ["php"],
          execPrefix: "/app"
        }
      }
};