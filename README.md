# Script Containerization Tool

A NodeJS-based tool that automatically validates, containerizes, and tests scripts based on their accompanying README instructions.

## Features

- Automated script validation and testing
- Docker container generation
- README-based instruction validation
- Automatic container testing
- Comprehensive error handling
- Virtual testing environment

## Prerequisites

Before you begin, ensure you have the following installed:
- NodeJS
- Docker

You'll also need to set up:
- `.env` file with your `OPENAI_API_KEY`

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

Run the tool using the following command:

```bash
npx ts-node src/index.ts <script_path> <readme_path>
```

Example:
```bash
npx ts-node src/index.ts resources/vowel_counter.js resources/README_vowel_counter.md
```

## How It Works

The tool follows a systematic process:

1. **Environment Validation**
   - Validates environment variables

2. **Input Validation**
   - Verifies provided script and README paths
   - Checks file accessibility and format

3. **Script Testing (AI)**
   - Performs virtual tests based on README examples
   - Runs additional automated tests
   - Validates script syntax

4. **Output Generation (AI)**
   - Creates a Dockerfile
   - Generates a new README with container instructions
   - Copies all necessary files to the `output` directory

5. **Container Testing**
   - Builds Docker container
   - Runs example tests within container
   - Validates outputs

## Output Directory Structure

After running the tool, you'll find the following in the `output` directory:
- `Dockerfile` - Container configuration
- `README.md` - Instructions for running the containerized script
- Your original script file

## Error Handling

The tool includes comprehensive error handling for:
- Missing prerequisites
- Invalid file paths
- Script syntax errors
- Container build failures
- Test execution errors

## Example

Using the vowel counter example:

1. Prepare your script (`vowel_counter.js`) and its README
2. Run the tool
3. Check the `output` directory for containerized version
4. Follow the generated README instructions to run your containerized script

## Troubleshooting

Common issues and their solutions:

- **Docker not running**: Ensure Docker daemon is running
- **Missing .env**: Create `.env` file with required API key
- **Permission errors**: Ensure proper file permissions

## Contributing

Feel free to submit issues and pull requests.

## License

[Your chosen license]