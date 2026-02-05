# Backend-Training

A TypeScript training project that fetches and processes Pokémon data based on specific criteria.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v20 or higher recommended)
- **npm** or **pnpm** or **yarn** (package manager)
- **TypeScript** (will be installed as a dependency)
- **Git**

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
```

This is a training project. Follow the guidelines in the assignment PDF for submission instructions.


## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Input File

Place the provided `pokemon.input.json` in the root directory, or use the `--input` flag to specify a custom path.

### 3. Build the Project

```bash
npm run build
```

### 4. Run the CLI

```bash
npm start
```

Or with custom options:

```bash
npm start -- --input ./pokemon.input.json --concurrency 10 --min-matches 15
```


## 🎯 CLI Options

| Option | Short | Description | Default | Range |
|--------|-------|-------------|---------|-------|
| `--input` | `-i` | Path to input JSON file | `./pokemon.input.json` | - |
| `--concurrency` | `-c` | Max concurrent requests | `5` | 1-50 |
| `--timeout` | `-t` | Request timeout (ms) | `30000` | 1000-120000 |
| `--retries` | `-r` | Retry attempts | `2` | 0-10 |
| `--min-matches` | `-m` | Min matches before stopping | `10` | 1+ |
| `--help` | `-h` | Show help message | - | - |


## 📤 Output Files

The CLI generates three JSON files in the root directory:

1. **output.summary.json** - Run statistics (processed, matched, failed, duration)
2. **output.passports.json** - Array of matched Pokemon with full details
3. **output.failures.json** - Array of failed items with error details

## 🏗️ Project Structure

```
pokemon-investigation/
├── src/
│   ├── test/               # Files related to unit testing testing
│   ├── cli.ts              # CLI entry point with argument parsing
│   ├── contracts.ts        # Type definitions (provided)
│   ├── schemas.ts          # Zod schemas for validation
│   ├── retry.ts            # Centralized retry logic
│   ├── pokemon-source.ts   # HTTP boundary with Axios
│   ├── criteria.ts         # Business logic for matching
│   └── runner.ts           # Main orchestration with concurrency
├── pokemon.input.json      # Input file (provided)
├── package.json
├── tsconfig.json
└── README.md
```


## 🎓 Key Design Features

### Strict TypeScript
- ✅ `strict: true` in tsconfig
- ✅ No `any` types
- ✅ Immutable domain models with `readonly`
- ✅ Discriminated unions for result types

### Zod Validation (3 Boundaries)
1. **Input File Boundary** - Validates `pokemon.input.json` structure
2. **HTTP Boundary** - Validates PokeAPI responses before mapping to DTOs
3. **CLI Boundary** - Validates runtime configuration with defaults and constraints

### Retry Logic
- ✅ Centralized in `retry.ts`
- ✅ Exponential backoff
- ✅ Retries only transient errors:
  - Network errors
  - Timeouts
  - HTTP 429 (Rate Limit)
  - HTTP 5xx (Server Errors)
- ✅ Never retries:
  - Validation errors
  - Non-429 4xx responses
  - Parsing errors

### Bounded Concurrency
- ✅ Batch-wise processing
- ✅ Don't queue new batches after `minMatches` reached
- ✅ No unbounded `Promise.all`

### Error Handling
- ✅ Preserves error causes
- ✅ Adds contextual information
- ✅ Partial failures don't abort the run
- ✅ Clear error messages with attempt counts

## 🔍 Matching Criteria

A Pokemon matches if it has:
- **At least one type** from: `electric`, `fire`, `psychic`
- **AND at least one move** from: `thunder-shock`, `quick-attack`, `electro-ball`, `thunder-wave`

## 🧪 Example Usage

### Basic Run
```bash
npm start
```

### Custom Configuration
```bash
npm start -- -i ./custom-input.json -c 15 -m 20 -t 45000 -r 3
```

### Dev Mode (without building)
```bash
npm run dev -- --input ./pokemon.input.json
```

## 📝 Example Output

### output.summary.json
```json
{
  "runId": "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
  "processed": 25,
  "matched": 10,
  "failed": 15,
  "durationMs": 12543
}
```

### output.passports.json
```json
[
  {
    "runId": "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
    "id": 25,
    "name": "pikachu",
    "baseExperience": 112,
    "height": 4,
    "types": ["electric"],
    "moves": ["thunder-shock", "quick-attack", "..."],
    "fetchedAt": "2026-02-04T14:30:45.123Z"
  }
]
```

### output.failures.json
```json
[
  {
    "name": "InvalidName",
    "attempts": 3,
    "message": "HTTP 404 for \"InvalidName\"",
    "cause": { "...": "..." }
  }
]
```

## 🐛 Troubleshooting

### "Cannot find module" errors
Make sure you've built the project:
```bash
npm run build
```

### TypeScript errors
Ensure you're using Node 20+ and have installed dependencies:
```bash
node --version  # Should be 20.x or higher
npm install
```

### Input file not found
Specify the correct path:
```bash
npm start -- --input ./path/to/pokemon.input.json
```


## 📚 Unit Testing

Make sure you've built the project:
```bash
npm run build
```

After running build command dist folder will get created

### Run test file
```bash
node dist/test/TEST_FILE_NAME.js
```

## 📚 Additional Notes

- The application Don't queue new batches after `minMatches` reached stop (early termination)
- Failed items are logged but don't stop the entire run
- Pokemon names are case-insensitive
- The `runId` is a unique UUID for each execution

## 🏆 Assignment Compliance

This implementation satisfies all requirements:
- ✅ Strict TypeScript with immutable types
- ✅ Zod validation at all boundaries
- ✅ Discriminated unions for state modeling
- ✅ Bounded concurrency with early exit
- ✅ Centralized retry logic with backoff
- ✅ Axios for HTTP with proper error handling
- ✅ Timeout handling via AbortController
- ✅ Clear separation of concerns
- ✅ Comprehensive error context preservation
- ✅ Type-safe boundaries throughout
\```
