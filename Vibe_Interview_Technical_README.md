# Vibe --- AI-Powered Autonomous Web Application Builder & Cloud IDE

> **Interview Preparation / Technical Deep Dive**
>
> Vibe is an autonomous AI development environment that converts
> natural-language prompts into runnable Next.js applications inside
> isolated cloud sandboxes. This README is organized as an **interview
> study guide**, not just project documentation.

------------------------------------------------------------------------

## Table of Contents

1.  [Project at a Glance](#1-project-at-a-glance)
2.  [The Problem Vibe Solves](#2-the-problem-vibe-solves)
3.  [Core Features](#3-core-features)
4.  [High-Level Architecture](#4-high-level-architecture)
5.  [Architecture Components](#5-architecture-components)
6.  [End-to-End Request Flow](#6-end-to-end-request-flow)
7.  [Technology Stack](#7-technology-stack)
8.  [Repository Structure](#8-repository-structure)
9.  [Database Architecture](#9-database-architecture)
10. [Authentication and Security](#10-authentication-and-security)
11. [AI Agent Architecture](#11-ai-agent-architecture)
12. [Tool Calling and Reverse RPC](#12-tool-calling-and-reverse-rpc)
13. [Sandbox Architecture](#13-sandbox-architecture)
14. [Self-Healing Development
    Server](#14-self-healing-development-server)
15. [Streaming Code Generation](#15-streaming-code-generation)
16. [Background Workflows with
    Inngest](#16-background-workflows-with-inngest)
17. [Performance and Optimization](#17-performance-and-optimization)
18. [Scalability and System Design](#18-scalability-and-system-design)
19. [Production Architecture](#19-production-architecture)
20. [Failure Handling and Debugging](#20-failure-handling-and-debugging)
21. [Real Project Challenges](#21-real-project-challenges)
22. [Design Decisions and
    Trade-offs](#22-design-decisions-and-trade-offs)
23. [Known Bugs and Weaknesses](#23-known-bugs-and-weaknesses)
24. [How I Would Improve Vibe](#24-how-i-would-improve-vibe)
25. [OOP and Design Patterns](#25-oop-and-design-patterns)
26. [DSA and Complexity](#26-dsa-and-complexity)
27. [Important Interview Concepts](#27-important-interview-concepts)
28. [Questions 81--88 --- Master
    Answers](#28-questions-81–88--master-answers)
29. [Likely Interview Follow-ups](#29-likely-interview-follow-ups)
30. [60--90 Second Project
    Introduction](#30-60–90-second-project-introduction)
31. [One-Page Cheat Sheet](#31-one-page-cheat-sheet)
32. [Top 30 Topics to Study](#32-top-30-topics-to-study)

------------------------------------------------------------------------

# 1. Project at a Glance

## What is Vibe?

**Vibe** is an AI-powered autonomous web application builder and cloud
IDE.

A user can describe an application in natural language:

``` text
Build a finance dashboard with:
- dark mode
- interactive revenue charts
- date filters
- responsive layout
```

Instead of simply returning code in a chat window, Vibe attempts to
complete the entire development loop:

``` text
Natural-language prompt
        ↓
AI reasoning
        ↓
Inspect existing project
        ↓
Generate / modify code
        ↓
Write code into sandbox
        ↓
Install dependencies if required
        ↓
Start Next.js application
        ↓
Run health checks
        ↓
Detect errors
        ↓
Repair code automatically
        ↓
Return working preview
```

The source analysis describes Vibe as a **dual-backend, event-driven AI
code-generation and sandbox orchestration platform**. The Node.js
service handles APIs, persistence, authentication and sandbox
orchestration, while the Python service runs the LangGraph-based AI
agent. fileciteturn1file0L28-L42

------------------------------------------------------------------------

## Project Goal

The main goal is to remove the repetitive work between:

> "I want this application"

and

> "Here is a running application."

Traditional coding assistants may generate code but leave the developer
to:

-   create the project
-   install dependencies
-   copy files
-   start the server
-   diagnose compilation errors
-   fix runtime errors
-   restart the application

Vibe tries to automate this entire loop.

------------------------------------------------------------------------

# 2. The Problem Vibe Solves

## Traditional AI Coding Workflow

A basic AI coding assistant typically looks like:

``` text
User
 ↓
AI
 ↓
Code snippet
 ↓
Developer copies code
 ↓
Install dependencies
 ↓
Run project
 ↓
Compilation error
 ↓
Developer debugs
 ↓
Ask AI again
```

The human remains responsible for the execution environment.

## Vibe Workflow

Vibe changes the model to:

``` text
User
 ↓
Vibe
 ↓
AI Agent
 ↓
Sandbox
 ↓
Code execution
 ↓
Validation
 ↓
Automatic repair
 ↓
Running application
```

The source report identifies three main pain points Vibe attempts to
remove:

1.  Local environment setup
2.  Manual code execution
3.  Manual compilation/runtime debugging

fileciteturn1file0L44-L57

------------------------------------------------------------------------

# 3. Core Features

## 3.1 User Authentication

The system supports:

-   signup
-   login
-   JWT authentication
-   HTTP-only cookie storage
-   password hashing with bcrypt

------------------------------------------------------------------------

## 3.2 Project Management

Authenticated users can:

-   create projects
-   list projects
-   retrieve a project
-   start a project
-   send prompts against a project
-   retrieve chat history

------------------------------------------------------------------------

## 3.3 Cloud Development Sandboxes

Each project can run inside an isolated E2B sandbox.

The analyzed environment uses:

-   Debian Linux
-   4 GB RAM
-   4 vCPUs
-   Next.js 14
-   Turbopack
-   Tailwind
-   Shadcn UI
-   port 3000

fileciteturn1file0L61-L70

The important architectural idea is:

> **The AI-generated code should not execute directly on the main API
> server.**

Instead:

``` text
AI-generated code
       ↓
isolated sandbox
       ↓
Next.js application
```

------------------------------------------------------------------------

## 3.4 Autonomous Agent

The Python service uses:

-   FastAPI
-   LangGraph
-   LangChain
-   DeepSeek Reasoner
-   Google Gemma

The agent has tools for:

``` text
read_files()
create_or_update_files()
terminal()
```

The agent can therefore behave more like an autonomous developer than a
simple text generator.

------------------------------------------------------------------------

## 3.5 Self-Healing

Vibe contains a custom `devServerAgent.ts` loop that can:

-   kill stale processes
-   clean port conflicts
-   repair `.next` permissions
-   start the Next.js server
-   inspect logs
-   identify missing dependencies
-   install missing packages
-   send relevant errors back to the LLM
-   retry the repair process

The loop is capped at **10 iterations**. fileciteturn1file0L629-L643

------------------------------------------------------------------------

## 3.6 Persistent Project State

Although E2B sandboxes are ephemeral, project source code is mirrored
into PostgreSQL.

This gives Vibe:

``` text
Persistent source
      ↓
PostgreSQL
      ↓
Fresh sandbox
      ↓
Project rehydration
```

Therefore, sandbox destruction does not necessarily mean project
destruction.

------------------------------------------------------------------------

# 4. High-Level Architecture

## Architecture Diagram

``` text
                         ┌─────────────────────┐
                         │       USER          │
                         │ Browser / Client    │
                         └──────────┬──────────┘
                                    │
                              HTTP / JSON
                                    │
                                    ▼
              ┌─────────────────────────────────────┐
              │       NODE.JS / EXPRESS API         │
              │                                     │
              │ Authentication                      │
              │ Project APIs                        │
              │ Message APIs                        │
              │ Tool APIs                           │
              │ Prisma / PostgreSQL                 │
              │ Sandbox orchestration               │
              └───────┬──────────────┬──────────────┘
                      │              │
             HTTP     │              │ Inngest Event
                      │              │
                      ▼              ▼
            ┌──────────────┐   ┌───────────────┐
            │   PYTHON     │   │    INNGEST    │
            │   FASTAPI    │   │   WORKFLOW    │
            │              │   │               │
            │  LangGraph   │   │ Sandbox       │
            │  AI Agent    │   │ Provisioning  │
            └──────┬───────┘   └───────┬───────┘
                   │                   │
                   │ Tool callbacks    │
                   ▼                   ▼
            ┌────────────────────────────────┐
            │          E2B SANDBOX           │
            │                                │
            │  Linux MicroVM                 │
            │  Next.js 14                    │
            │  Turbopack                    │
            │  Port 3000                     │
            └──────────────┬─────────────────┘
                           │
                           │ SQL persistence
                           ▼
                  ┌──────────────────┐
                  │   PostgreSQL     │
                  │                  │
                  │ Users            │
                  │ Projects         │
                  │ Files            │
                  │ Messages         │
                  │ Sandboxes        │
                  │ Templates        │
                  └──────────────────┘
```

The analyzed source specifically identifies the Node.js/Express gateway,
Python FastAPI/LangGraph agent, Inngest workflow engine, E2B sandbox and
PostgreSQL persistence layers. fileciteturn1file0L180-L251

------------------------------------------------------------------------

# 5. Architecture Components

## 5.1 Client

The repository contains a Next.js 16 client with:

-   React
-   Tailwind CSS
-   Shadcn UI
-   TypeScript

However, an important distinction must be remembered for interviews:

> The analyzed `client/src/app/page.tsx` is currently only a
> scaffold/placeholder and is not a complete production UI.

The source report explicitly flags this as a major incomplete area.
fileciteturn1file0L865-L871

Therefore, do **not** tell an interviewer that a complete frontend chat
IDE is already implemented unless you actually implement it.

------------------------------------------------------------------------

## 5.2 Node.js / Express Backend

The Node backend acts as the main orchestration layer.

Responsibilities:

-   authentication
-   project APIs
-   message APIs
-   database operations
-   E2B communication
-   tool endpoints
-   Inngest integration
-   self-healing
-   persistence synchronization

Port:

``` text
5000
```

------------------------------------------------------------------------

## 5.3 Python / FastAPI Backend

Responsibilities:

-   LLM integration
-   LangGraph state management
-   tool calling
-   autonomous reasoning
-   communication with Node tool endpoints

Port:

``` text
8000
```

------------------------------------------------------------------------

## 5.4 Inngest

Inngest handles long-running / durable sandbox provisioning.

Instead of:

``` text
HTTP request
   ↓
create VM
   ↓
wait
   ↓
return
```

the architecture can do:

``` text
HTTP request
   ↓
emit event
   ↓
Inngest
   ↓
create sandbox
   ↓
save sandbox information
```

This is useful because infrastructure creation can take seconds and can
fail independently of the original HTTP request.

------------------------------------------------------------------------

## 5.5 PostgreSQL

PostgreSQL stores the persistent application state:

``` text
User
Project
File
fileVersion
Message
Sandbox
Template
TemplateFile
```

------------------------------------------------------------------------

## 5.6 E2B

E2B provides the isolated execution environment where AI-generated
applications and shell commands run.

This is one of the most important architectural decisions in the
project.

------------------------------------------------------------------------

# 6. End-to-End Request Flow

Consider:

``` text
Add an interactive revenue chart with date filters.
```

## Step 1 --- User Request

The client sends:

``` http
POST /:project_id/messages
```

with:

``` json
{
  "my_message": "Add an interactive revenue chart with date filters"
}
```

The source analysis traces this operation through authentication,
sandbox validation, project rehydration, Python agent execution, tool
callbacks, file persistence and final validation.
fileciteturn1file0L368-L449

------------------------------------------------------------------------

## Step 2 --- JWT Authentication

The authentication middleware:

``` text
Cookie
  ↓
token
  ↓
jwt.verify()
  ↓
req.user
```

The token contains user information such as:

``` text
id
role
name
```

------------------------------------------------------------------------

## Step 3 --- Validate Project Request

The controller:

-   extracts `project_id`
-   validates the message
-   returns `400` if the message is missing

------------------------------------------------------------------------

## Step 4 --- Check Sandbox

PostgreSQL is queried for an active sandbox:

``` text
project_id
AND
expires_at > now()
```

If an active sandbox exists:

``` text
reuse sandbox
```

If it does not:

``` text
Express
  ↓
Inngest event
  ↓
E2B sandbox creation
  ↓
save sandbox_id + URL
```

------------------------------------------------------------------------

## Step 5 --- Persist User Message

The user message is inserted into the `Message` table.

------------------------------------------------------------------------

## Step 6 --- Rehydrate Project

Two cases exist.

### Existing project

``` text
PostgreSQL File rows
       ↓
Read file paths/content
       ↓
E2B filesystem
```

### New project

``` text
TemplateFile
      ↓
cloneTemplateToProject()
      ↓
Project File rows
      ↓
E2B filesystem
```

------------------------------------------------------------------------

## Step 7 --- Invoke Python Agent

Node sends the project and conversation to:

``` text
POST /call_llm
```

The Python service creates the LangGraph execution graph.

------------------------------------------------------------------------

## Step 8 --- Agent Inspects Project

The LLM can decide:

``` text
read_files()
```

Python then calls:

``` text
POST /tools/readFiles
```

on Node.

------------------------------------------------------------------------

## Step 9 --- Node Executes Tool

Node:

``` text
x-project-id
      ↓
find sandbox
      ↓
connect to E2B
      ↓
read file
      ↓
return content
```

------------------------------------------------------------------------

## Step 10 --- Agent Generates Changes

The agent reasons over the existing code and invokes:

``` text
create_or_update_files()
```

Node then:

``` text
write to E2B
      +
upsert into PostgreSQL
```

This dual-write is important:

``` text
Runtime state  → E2B
Persistent state → PostgreSQL
```

------------------------------------------------------------------------

## Step 11 --- Validate

The agent executes:

``` bash
curl http://localhost:3000
```

If it receives:

``` text
200
```

the task is considered valid.

The agent produces:

``` text
<task_summary>...</task_summary>
```

and the LangGraph transitions to `END`.

------------------------------------------------------------------------

## Step 12 --- Return Result

Node stores the assistant response and returns the result to the client.

------------------------------------------------------------------------

# 7. Technology Stack

  -------------------------------------------------------------------------
  Technology              Role                    Why It Exists
  ----------------------- ----------------------- -------------------------
  TypeScript              Main Node/client        Static typing and
                          language                maintainability

  Node.js                 API runtime             Async I/O and JS
                                                  ecosystem

  Express 5               API framework           Lightweight
                                                  routing/middleware

  Python                  AI service              Strong AI/agent ecosystem

  FastAPI                 AI API                  Async Python HTTP service

  LangGraph               Agent workflow          Cyclic stateful tool
                                                  execution

  LangChain               LLM abstraction         Messages/tools/provider
                                                  integration

  PostgreSQL              Persistence             Relational consistency

  Prisma                  ORM                     Type-safe DB access

  E2B                     Code sandbox            Isolated code execution

  Inngest                 Durable workflows       Background
                                                  orchestration/retries

  JWT                     Authentication          Stateless authentication

  bcrypt                  Password hashing        One-way password hashing

  Zod                     Node validation         Runtime request
                                                  validation

  Pydantic                Python validation       Typed Python
                                                  request/state validation

  Tailwind                Styling                 Utility-first styling

  Shadcn UI               Components              Reusable UI primitives

  Axios / HTTPX           HTTP clients            Service-to-service
                                                  communication
  -------------------------------------------------------------------------

The analyzed project uses the versions and locations listed in the
original technical audit. fileciteturn1file0L105-L178

------------------------------------------------------------------------

# 8. Repository Structure

``` text
vibe/
│
├── client/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── globals.css
│       ├── components/
│       │   └── ui/
│       ├── hooks/
│       └── lib/
│
├── python-backend/
│   ├── main.py
│   ├── System_Prompt.py
│   └── requirements.txt
│
└── server/
    ├── package.json
    ├── prisma.config.ts
    ├── prisma/
    │   ├── schema.prisma
    │   └── migrations/
    │
    ├── e2b/
    │   └── nextapp/
    │       ├── e2b.Dockerfile
    │       ├── e2b.toml
    │       └── start.sh
    │
    └── src/
        ├── server.ts
        ├── router/
        ├── controllers/
        ├── middleware/
        ├── inngest/
        ├── agents/
        ├── repositories/
        ├── utils/
        └── scripts/
```

The detailed file-by-file structure and the five highest-priority
interview files are documented in the source audit.
fileciteturn1file0L276-L366

------------------------------------------------------------------------

# 9. Database Architecture

## Entity Relationship

``` text
User
 │
 └──────< Project
             │
             ├──────< File
             │          │
             │          └──────< fileVersion
             │
             ├──────< Message
             │
             └──────< Sandbox

Template
 │
 └──────< TemplateFile
```

The source schema describes:

-   `User 1:N Project`
-   `Project 1:N File`
-   `Project 1:N Message`
-   `Project 1:N Sandbox`
-   `File 1:N fileVersion`
-   `Template 1:N TemplateFile` fileciteturn1file0L459-L537

------------------------------------------------------------------------

## File Model

The important constraint is:

``` prisma
@@unique([project_id, path])
```

This means a project cannot have two active rows for the same path.

Example:

``` text
Project 20
 ├── app/page.tsx
 ├── app/layout.tsx
 └── components/chart.tsx
```

The same project cannot have two separate active `app/page.tsx` records.

This allows:

``` text
upsert(project_id, path)
```

rather than:

``` text
SELECT
IF EXISTS
   UPDATE
ELSE
   INSERT
```

The latter can introduce race conditions unless carefully synchronized.

------------------------------------------------------------------------

## Why PostgreSQL Instead of Only the Sandbox?

The sandbox is ephemeral.

PostgreSQL provides durable state:

``` text
Sandbox dies
    ↓
Database still contains files
    ↓
New sandbox
    ↓
Rehydrate project
```

This is one of the strongest architectural explanations in an interview.

------------------------------------------------------------------------

## File Storage Trade-off

Current approach:

``` text
PostgreSQL
 └── File.content = source code
```

Advantages:

-   simple
-   transactional metadata
-   easy project rehydration
-   easy relational ownership

Disadvantages at scale:

-   large DB size
-   larger WAL traffic
-   cache pressure
-   backups become heavier
-   source blobs are not what relational databases are optimized for

A future design could use:

``` text
PostgreSQL
 ├── project metadata
 ├── file metadata
 ├── object key
 └── content hash

S3 / R2
 └── actual source content
```

The original audit explicitly identifies PostgreSQL file storage as a
scalability concern. fileciteturn1file0L553-L562

------------------------------------------------------------------------

# 10. Authentication and Security

## Current Authentication Flow

``` text
Signup
  ↓
bcrypt.hash(password, 10)
  ↓
PostgreSQL

Login
  ↓
bcrypt.compare()
  ↓
JWT creation
  ↓
HTTP-only cookie
  ↓
authMiddleware
  ↓
Protected route
```

The source audit confirms password hashing, password verification, JWT
generation, HTTP-only cookie storage, authentication middleware and Zod
validation are implemented. fileciteturn1file0L564-L586

------------------------------------------------------------------------

## Why HTTP-only Cookie?

An HTTP-only cookie cannot be directly read by normal browser
JavaScript.

This reduces the impact of certain token-stealing attacks through XSS.

However:

> HTTP-only does **not** mean the application is automatically secure.

Cookie security should also consider:

``` text
HttpOnly
Secure
SameSite
Expiration
CSRF protection
```

------------------------------------------------------------------------

## Critical Security Issues Identified

### 1. Password Hash Exposure

The current auth responses return the complete user object, including
the bcrypt hash.

Bad:

``` json
{
  "id": 1,
  "email": "user@example.com",
  "password": "$2b$10$..."
}
```

Better:

``` text
User DB record
     ↓
remove password
     ↓
API response
```

For example:

``` ts
const { password, ...safeUser } = user;
return res.json({ user: safeUser });
```

The audit identifies this as a high-severity issue.
fileciteturn1file0L844-L851

------------------------------------------------------------------------

### 2. Tool Endpoint Authentication

Current tool middleware primarily relies on:

``` text
x-project-id
```

That is not sufficient authentication.

An attacker should not be able to simply supply:

``` http
x-project-id: 20
```

and access project tools.

A stronger design:

``` text
Python Agent
    ↓
internal authentication
    ↓
Node Tool Server
    ↓
verify project authorization
    ↓
E2B
```

Potential mechanisms:

-   internal service credential
-   mTLS
-   private networking
-   signed short-lived service tokens
-   API gateway/service identity

------------------------------------------------------------------------

### 3. Project Ownership / IDOR

A project request should not only check:

``` text
project_id = 20
```

It should check:

``` text
project_id = 20
AND
user_id = authenticated_user
```

Otherwise:

``` text
User A
 ↓
project_id = User B's project
 ↓
access / modification
```

This is an **Insecure Direct Object Reference (IDOR)** / broken
object-level authorization problem.

The source audit reports ownership checks are inconsistent across
endpoints. fileciteturn1file0L577-L586

------------------------------------------------------------------------

### 4. Shell Command Injection

The tool endpoint constructs a shell command from input.

This is dangerous because shell syntax can change the meaning of the
command.

General rule:

> Never concatenate untrusted input into shell commands.

Safer approaches:

-   argument-array APIs
-   command allowlists
-   strict path validation
-   dedicated tool APIs instead of arbitrary shell access
-   sandbox-level defense-in-depth

The audit identifies this as a critical vulnerability.
fileciteturn1file0L825-L842

------------------------------------------------------------------------

### 5. Path Traversal

A file path should never allow:

``` text
../../etc/passwd
```

The safe strategy is:

``` text
requested path
      ↓
resolve against project root
      ↓
canonicalize
      ↓
verify it remains inside project root
      ↓
perform operation
```

Simply removing leading `/` is not enough.

------------------------------------------------------------------------

# 11. AI Agent Architecture

The Python service implements a LangGraph `StateGraph`.

Conceptually:

``` text
                START
                  │
                  ▼
              ┌───────┐
              │ Agent │
              └───┬───┘
                  │
           tool call?
             /       \
           yes        no
            │          │
            ▼          ▼
         Tools        END
            │
            ▼
          Agent
```

The source identifies two major graph nodes:

``` text
agent
tools
```

and a conditional transition called:

``` text
should_continue
```

fileciteturn1file0L659-L670

------------------------------------------------------------------------

## Agent State

The analyzed state contains:

``` text
messages
files
summary
```

The important idea is that the LLM is not simply called once.

It can reason:

``` text
Need existing code
 ↓
read_files()
 ↓
inspect result
 ↓
Need modification
 ↓
create_or_update_files()
 ↓
Need validation
 ↓
terminal()
 ↓
inspect result
 ↓
Fix if necessary
 ↓
task_summary
```

This is why LangGraph is useful: the workflow is naturally **cyclic**.

------------------------------------------------------------------------

# 12. Tool Calling and Reverse RPC

This is one of the strongest technical concepts to explain in the
interview.

## Why Reverse Communication?

The E2B SDK is integrated into Node.

The AI agent lives in Python.

Therefore:

``` text
Python
  ↓
cannot directly use Node's E2B client
```

Instead:

``` text
Python Agent
      ↓
HTTP tool callback
      ↓
Node /tools/*
      ↓
E2B SDK
      ↓
Sandbox
```

The source explicitly describes this as a reverse tool-callback pattern.
fileciteturn1file0L943-L950

------------------------------------------------------------------------

## Example

LLM decides:

``` text
read app/page.tsx
```

Python:

``` text
read_files(["app/page.tsx"])
```

HTTP:

``` http
POST /tools/readFiles
x-project-id: 20
```

Node:

``` text
find sandbox
    ↓
sandbox.files.read()
    ↓
return contents
```

Python receives the result and continues the LangGraph execution.

------------------------------------------------------------------------

## Interview Insight

This is effectively an internal RPC mechanism.

You can describe it as:

> "The Python service owns the reasoning loop, while the Node service
> owns execution capabilities. We separated those responsibilities and
> connected them through internal HTTP tool calls."

That is a much stronger explanation than simply saying:

> "Python calls Node."

------------------------------------------------------------------------

# 13. Sandbox Architecture

## Why Sandbox AI-Generated Code?

The AI can generate:

``` text
npm install
rm
shell scripts
Node processes
build commands
file writes
```

Running arbitrary AI-generated commands directly on the API host would
be dangerous.

Instead:

``` text
Main API
   │
   │ controlled API
   ▼
Isolated E2B sandbox
   │
   ├── generated source
   ├── npm
   ├── Next.js
   └── shell commands
```

The source audit identifies isolation of arbitrary generated code as one
of the primary architectural reasons for using E2B.
fileciteturn1file0L268-L274

------------------------------------------------------------------------

## Ephemeral Infrastructure

The sandbox is not the source of truth.

Instead:

``` text
PostgreSQL = persistent project state
E2B = temporary execution state
```

This separation is fundamental.

------------------------------------------------------------------------

# 14. Self-Healing Development Server

This is arguably the most interview-worthy custom feature.

## Problem

AI-generated code is not guaranteed to compile.

Examples:

``` text
Module not found
TypeError
ReferenceError
EACCES
EADDRINUSE
```

A normal application would simply fail.

Vibe tries to automatically recover.

------------------------------------------------------------------------

## Algorithm

``` text
Start server
    ↓
Check port 3000
    ↓
HTTP 200?
   /   \
 yes    no
 │       │
END   Read logs
          │
          ▼
      Classify error
       /    |     \
      /     |      \
missing   code    permission
package   error     error
   │        │          │
npm install │       repair
   │        │
   └────┬───┘
        ↓
     retry
        ↓
   max 10 times
```

The implementation performs process cleanup, `.next` permission repair,
server startup, curl health checks, regex-based error extraction,
missing-package installation and LLM-assisted repairs.
fileciteturn1file0L629-L643

------------------------------------------------------------------------

## Why Use Heuristics Before the LLM?

Suppose the log says:

``` text
Cannot find module 'recharts'
```

There is no need to ask the LLM:

``` text
What should I do?
```

The deterministic solution is:

``` bash
npm install recharts
```

This saves:

-   model latency
-   tokens
-   cost
-   unnecessary reasoning

This is an excellent example of combining:

``` text
AI reasoning
+
deterministic automation
```

------------------------------------------------------------------------

## Why Limit Retries?

Without a limit:

``` text
AI fails
 ↓
AI tries fix
 ↓
new error
 ↓
AI tries fix
 ↓
...
∞
```

This could create:

-   infinite cost
-   infinite execution
-   resource exhaustion
-   unpredictable behavior

The project uses:

``` text
MAX_ITERATIONS = 10
```

The retry cap is a simple but important reliability mechanism.

------------------------------------------------------------------------

# 15. Streaming Code Generation

Vibe also contains a streaming mechanism based on custom tags:

``` xml
<vibe-write file_path="app/page.tsx">
...
</vibe-write>
```

------------------------------------------------------------------------

## The Problem

HTTP chunks do not necessarily match logical application messages.

For example, the network may produce:

``` text
Chunk 1:
<vibe-write file_path="app/

Chunk 2:
page.tsx">
export default ...

Chunk 3:
</vibe-write>
```

A parser that expects the entire tag in one chunk would fail.

------------------------------------------------------------------------

## Current Solution

Maintain an accumulator:

``` text
buffer += incoming_chunk
```

Then:

``` text
if buffer contains </vibe-write>
    extract complete block
    parse file path
    extract content
    write file
    persist DB
    remove processed block
```

This makes the parser robust against delimiter fragmentation.

The source audit describes this exact accumulator/sliding-window
strategy. fileciteturn1file0L645-L657

------------------------------------------------------------------------

## Complexity

If the buffer is repeatedly searched, the practical cost depends on the
string-search implementation and amount of retained buffer.

For interview purposes:

> "The parser is linear-ish for normal streaming workloads, but repeated
> substring searches over a growing buffer can produce avoidable
> overhead. A more sophisticated streaming parser could process
> delimiters incrementally."

Avoid claiming an exact asymptotic complexity without specifying the
string-search implementation.

------------------------------------------------------------------------

# 16. Background Workflows with Inngest

## Why Not Provision the Sandbox Directly?

Imagine:

``` text
POST /project/start

create E2B VM
    ↓
3–8 seconds
    ↓
save DB
    ↓
response
```

Problems:

-   long request
-   gateway timeout risk
-   poor failure handling
-   harder retries
-   user connection remains open

------------------------------------------------------------------------

## Event-Driven Version

``` text
API
 ↓
send event
 ↓
Inngest
 ↓
Step 1: check DB
 ↓
Step 2: create sandbox
 ↓
Step 3: resolve URL
 ↓
Step 4: persist sandbox
```

The source identifies this as the solution to the original synchronous
provisioning timeout problem. fileciteturn1file0L763-L769

------------------------------------------------------------------------

## Durable Execution

A key interview concept:

> A durable workflow records completed steps so failures can be retried
> without necessarily repeating every previous operation.

For example:

``` text
Step 1 complete
Step 2 complete
Step 3 failed
```

A good workflow engine can retry step 3 rather than unnecessarily
repeating expensive work.

This is particularly valuable for infrastructure operations.

------------------------------------------------------------------------

# 17. Performance and Optimization

## Optimizations Actually Implemented

### 17.1 Pre-Baked Sandbox Image

Instead of:

``` text
new sandbox
 ↓
create-next-app
 ↓
npm install
 ↓
install UI libraries
 ↓
start
```

the project uses a pre-built environment.

Conceptually:

``` text
Docker image
 ├── Next.js
 ├── Tailwind
 ├── Shadcn
 └── common dependencies
```

This significantly reduces initialization work.

The audit identifies this as a primary cold-start optimization.
fileciteturn1file0L673-L687

------------------------------------------------------------------------

### 17.2 Connection Pooling

Database connections should be reused rather than repeatedly opening new
connections.

``` text
Without pooling:

Request
 ↓
create connection
 ↓
query
 ↓
close

Request
 ↓
create connection
...
```

With pooling:

``` text
       ┌──────────────┐
       │ Connection   │
       │ Pool         │
       └──────┬───────┘
          ┌───┼───┐
          ▼   ▼   ▼
        Query Query Query
```

------------------------------------------------------------------------

### 17.3 Atomic File Upserts

The composite uniqueness constraint enables an efficient upsert model.

``` text
(project_id, path)
```

acts as the identity of a project file.

------------------------------------------------------------------------

### 17.4 Selective Queries

Instead of fetching unnecessary data:

``` text
SELECT *
```

the project uses selected fields in project listing.

This reduces:

-   network transfer
-   serialization
-   application memory
-   database work

------------------------------------------------------------------------

### 17.5 Deterministic Dependency Repair

Missing-package errors are solved directly instead of using another LLM
call.

This is a strong example of latency optimization.

------------------------------------------------------------------------

# 18. Scalability and System Design

## Current Architecture vs Scaled Architecture

### Current

``` text
                    Users
                      ↓
                Node.js API
                 /    |    \
                ↓     ↓     ↓
             Python Inngest DB
                ↓
              E2B
```

At larger scale, the design should become:

``` text
                       Users
                         │
                         ▼
                 Load Balancer / CDN
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
        Node API #1             Node API #N
             │                       │
             └──────────┬────────────┘
                        ▼
                     Redis
                        │
                ┌───────┴───────┐
                ▼               ▼
           Job Queue        PostgreSQL
                │
                ▼
          Agent Workers
                │
                ▼
         Sandbox Manager
                │
        ┌───────┼───────┐
        ▼       ▼       ▼
      E2B     E2B     E2B
```

------------------------------------------------------------------------

## First Bottlenecks

At 10× scale, likely pressure points include:

1.  Node process CPU
2.  PostgreSQL connection pool
3.  database query frequency
4.  sequential file writes
5.  sandbox provisioning limits
6.  LLM provider rate limits
7.  long-lived HTTP connections
8.  storage growth

The original audit identifies connection-pool pressure, Node CPU and
sandbox/LLM limits as important scale concerns.
fileciteturn1file0L702-L718

------------------------------------------------------------------------

## Horizontal Scaling

Instead of:

``` text
1 Node server
```

use:

``` text
Load Balancer
   │
   ├── Node #1
   ├── Node #2
   ├── Node #3
   └── Node #N
```

This works best when API instances are stateless.

Persistent state belongs in:

``` text
PostgreSQL
Redis
Object Storage
Queue
```

rather than local server memory.

------------------------------------------------------------------------

## Redis

Redis can be useful for:

-   cache
-   rate limiting
-   distributed locks
-   short-lived job state
-   pub/sub
-   session state if sessions are redesigned

Do not say:

> "Use Redis because Redis is fast."

Better:

> "I would use Redis where repeated reads or coordination become
> bottlenecks, for example caching project metadata or coordinating
> distributed work."

------------------------------------------------------------------------

## Database Read Replicas

For a read-heavy system:

``` text
                 Primary
                /       \
             writes     replication
                         /       \
                       Read     Read
                     Replica   Replica
```

However, read replicas introduce **eventual consistency**.

If the user writes a file and immediately reads from a lagging replica,
they might not see the latest version.

A good interview answer:

> "I would route write-after-read-sensitive operations to the primary or
> use consistency-aware routing. Replicas are appropriate for workloads
> where slight replication lag is acceptable."

------------------------------------------------------------------------

## Sandbox Scaling

One million registered users does **not** mean one million active
sandboxes.

This distinction is critical.

``` text
1M registered users
       ≠
1M concurrent sandboxes
```

Sandboxes should have:

-   idle timeout
-   lease expiration
-   cleanup
-   hibernation/recreation
-   concurrency limits
-   quota management

The project already models sandbox expiry in PostgreSQL.
fileciteturn1file0L535-L551

------------------------------------------------------------------------

# 19. Production Architecture

A mature production deployment could look like:

``` text
                     Internet
                        │
                        ▼
                CDN / Load Balancer
                        │
               ┌────────┴────────┐
               ▼                 ▼
           Node API          Node API
               │                 │
               └────────┬────────┘
                        │
             ┌──────────┼──────────┐
             ▼          ▼          ▼
           Redis     PostgreSQL   Queue
                                    │
                                    ▼
                              Python Workers
                                    │
                                    ▼
                              E2B Sandboxes
```

------------------------------------------------------------------------

## Production Observability

At minimum monitor:

### API

-   request rate
-   latency
-   4xx rate
-   5xx rate
-   active connections

### Database

-   CPU
-   connections
-   query latency
-   slow queries
-   locks
-   replication lag

### Agent

-   LLM latency
-   token usage
-   tool-call count
-   agent failure rate
-   retry count

### Sandbox

-   creation latency
-   active sandboxes
-   expired sandboxes
-   CPU/memory usage
-   startup failures
-   port failures

### Self-Healing

-   number of repair attempts
-   successful repairs
-   failed repairs
-   average repair iterations

------------------------------------------------------------------------

## Production Gaps Identified

The source audit identifies:

-   lack of structured logging
-   missing health/readiness endpoints
-   no automated CI/CD workflow
-   migration deployment not automated in a release pipeline

fileciteturn1file0L721-L745

These should be described as **known gaps**, not hidden.

------------------------------------------------------------------------

# 20. Failure Handling and Debugging

## Production Debugging Method

Use:

``` text
Detect
  ↓
Assess impact
  ↓
Mitigate
  ↓
Collect evidence
  ↓
Identify root cause
  ↓
Reproduce
  ↓
Fix
  ↓
Test
  ↓
Deploy
  ↓
Monitor
  ↓
Post-mortem
```

------------------------------------------------------------------------

## Example: Vibe Generation Failure

Suppose a generation returns HTTP 500.

### First question

Is everything failing?

Or:

``` text
Only one project?
Only one endpoint?
Only LLM calls?
Only sandbox creation?
Only DB writes?
```

------------------------------------------------------------------------

## Trace the Request

``` text
Client
 ↓
Express
 ↓
PostgreSQL
 ↓
Python
 ↓
LangGraph
 ↓
Tool endpoint
 ↓
E2B
 ↓
Next.js
```

Check each boundary.

------------------------------------------------------------------------

## Logs

For a sandbox issue:

``` text
/tmp/server.log
```

can contain Next.js/Turbopack errors.

For Python:

``` text
FastAPI logs
LangGraph execution
tool responses
```

For Node:

``` text
HTTP status
controller errors
database errors
sandbox errors
```

------------------------------------------------------------------------

## Correlation IDs

A production-grade improvement:

``` text
Request ID: abc-123
```

Pass it through:

``` text
Client
 ↓
Node
 ↓
Python
 ↓
Tool request
 ↓
Sandbox job
```

Then a single request can be traced across services.

------------------------------------------------------------------------

# 21. Real Project Challenges

## Challenge 1 --- Zombie Processes

### Problem

Next.js crashed but child processes remained alive.

Then a restart produced:

``` text
EADDRINUSE
```

### Root Cause

Port 3000 was still occupied.

### Solution

The self-healing agent uses:

``` text
PID cleanup
fuser
lsof
pkill
```

before restarting.

The source describes this as a real project challenge.
fileciteturn1file0L747-L761

### Interview Answer

> "The challenge was not simply restarting Next.js; it was ensuring the
> entire previous process tree was gone. A single PID kill was not
> always enough because child processes could survive. I therefore added
> multiple cleanup mechanisms and validated the port before restarting."

------------------------------------------------------------------------

# Challenge 2 --- Sandbox Provisioning Timeout

### Problem

E2B provisioning could take several seconds.

### Original Design

``` text
HTTP request
 ↓
Provision sandbox
 ↓
Wait
 ↓
Response
```

### Problem

Long requests caused gateway/client timeouts.

### Solution

Move provisioning into Inngest.

``` text
Request
 ↓
event
 ↓
Inngest
 ↓
sandbox
```

The audit documents this transition from synchronous provisioning to
durable workflow execution. fileciteturn1file0L763-L769

------------------------------------------------------------------------

# Challenge 3 --- Streaming Chunk Fragmentation

### Problem

A tag could be split across network chunks.

### Solution

Use an accumulator buffer.

``` text
chunk 1 + chunk 2 + chunk 3
             ↓
        complete tag
             ↓
         parse/write
```

The audit documents this as a specific reliability issue encountered by
the project. fileciteturn1file0L771-L778

------------------------------------------------------------------------

# 22. Design Decisions and Trade-offs

## Node.js + Python

### Decision

Node:

``` text
API
DB
E2B
streaming
```

Python:

``` text
LLM
LangGraph
agent
```

### Why?

Python has a strong AI/agent ecosystem, while Node is convenient for the
existing API and cloud/runtime integration.

### Trade-off

You now have:

``` text
two services
+
two runtimes
+
service communication
+
deployment complexity
```

If the agent were trivial, one backend might be simpler.

But for an AI-heavy architecture, the separation is defensible.

------------------------------------------------------------------------

## E2B vs Local Docker

### E2B advantages

-   isolation
-   managed infrastructure
-   disposable environments
-   easier multi-tenant execution model

### Local Docker drawbacks

Running arbitrary generated commands through the host Docker daemon
increases the blast radius of a sandbox escape or resource exhaustion.

------------------------------------------------------------------------

## PostgreSQL File Storage vs Object Storage

### PostgreSQL

Good for:

-   simplicity
-   transactional metadata
-   easy querying
-   quick prototype

### Object storage

Better for:

-   huge files
-   large project counts
-   cheap blob storage
-   CDN integration

A mature architecture would likely use both.

------------------------------------------------------------------------

# 23. Known Bugs and Weaknesses

This section is extremely important for the interview.

**Never claim the project is perfect.**

The source audit identified the following issues.

------------------------------------------------------------------------

## Critical

### 1. Message Role Enum Mismatch

Schema:

``` text
Role = admin | user
```

but application code attempts:

``` text
assistant
```

Therefore:

``` text
PostgreSQL
 ↓
invalid enum value
 ↓
request failure
```

The audit identifies this as a critical runtime bug.
fileciteturn1file0L793-L823

### Correct Design

Use something like:

``` text
MessageRole:
  user
  assistant
  system
```

Then run a proper migration.

------------------------------------------------------------------------

## Critical

### 2. Unauthenticated Tool Endpoints

The tool endpoints rely on project ID information without sufficient
caller authentication.

Impact:

``` text
attacker
 ↓
tool endpoint
 ↓
sandbox command
```

This is especially dangerous because the tool layer can execute
commands.

------------------------------------------------------------------------

## Critical

### 3. Shell Command Injection

Untrusted command strings are passed to shell execution.

This must be fixed before production exposure.

------------------------------------------------------------------------

## High

### 4. Password Hash Returned to Client

Never return:

``` text
password hash
```

in an API response.

------------------------------------------------------------------------

### 5. Database Busy Polling

Current pattern:

``` ts
while (!sandboxSchema) {
    await sleep(2000);
    sandboxSchema = await sandboxRecord(project_id);
}
```

Problems:

-   request remains open
-   repeated database queries
-   poor scalability
-   bad failure behavior

Better:

``` text
202 Accepted
 ↓
job ID
 ↓
SSE/WebSocket/status endpoint
```

------------------------------------------------------------------------

### 6. Incomplete Frontend

The client is currently scaffold-level according to the audit.

Do not present the frontend as a completed end-user IDE unless that
implementation has been added.

------------------------------------------------------------------------

## Medium

-   missing CORS configuration
-   inconsistent cookie configuration
-   destructive rollback behavior
-   missing database indexes

------------------------------------------------------------------------

# 24. How I Would Improve Vibe

If asked:

> "What would you improve if you had another month?"

A strong answer:

## Phase 1 --- Security

1.  Fix tool authentication
2.  Enforce project ownership everywhere
3.  Fix shell command injection
4.  Add path traversal protection
5.  Never return password hashes
6.  Add CSRF strategy
7.  Standardize secure cookie configuration

------------------------------------------------------------------------

## Phase 2 --- Reliability

1.  Fix `assistant` enum mismatch
2.  Add health checks
3.  Add graceful shutdown
4.  Add structured logs
5.  Add request correlation IDs
6.  Replace destructive rollback with version-aware rollback

------------------------------------------------------------------------

## Phase 3 --- Scalability

1.  Remove database polling
2.  Add queue-based agent execution
3.  Add Redis where justified
4.  Add database indexes
5.  Parallelize safe file operations
6.  Add message/project pagination
7.  Move large file contents to object storage

------------------------------------------------------------------------

## Phase 4 --- Product

1.  Complete frontend
2.  Build file explorer
3.  Add live preview
4.  Add chat UI
5.  Add project history
6.  Add file versioning
7.  Add diff viewer
8.  Add undo/rollback

------------------------------------------------------------------------

# 25. OOP and Design Patterns

## Repository Pattern

Repository files isolate database operations:

``` text
Controller
    ↓
Repository
    ↓
Prisma
    ↓
PostgreSQL
```

Example:

``` text
chats.repository.ts
writeInDB.repository.ts
sandboxRecord.repository.ts
```

### Benefit

Controllers don't need to know every database detail.

------------------------------------------------------------------------

## Adapter Pattern

The Prisma PostgreSQL adapter acts as an abstraction between Prisma and
the underlying PostgreSQL driver/pool.

------------------------------------------------------------------------

## State Machine / Graph Pattern

LangGraph:

``` text
START
 ↓
Agent
 ↓
Tools
 ↓
Agent
 ↓
END
```

This is effectively a state-machine/workflow model.

------------------------------------------------------------------------

## Separation of Concerns

Vibe separates:

``` text
Routing
Controllers
Repositories
Agents
Utilities
Infrastructure
```

This makes the codebase easier to reason about than putting everything
in one Express controller.

------------------------------------------------------------------------

# 26. DSA and Complexity

You should not force DSA into the project.

Instead, identify where algorithmic thinking naturally appears.

------------------------------------------------------------------------

## Streaming Parser

Data structure:

``` text
String buffer
```

Operations:

``` text
append chunk
search delimiter
extract block
remove processed block
```

The main performance concern is repeated scanning.

------------------------------------------------------------------------

## LangGraph

The graph can be represented as:

``` text
Nodes
+
Edges
+
State
```

This resembles a directed graph with conditional transitions.

------------------------------------------------------------------------

## Database Indexing

Indexes are data structures used to avoid scanning the entire table.

For example:

``` text
WHERE project_id = ?
AND expires_at > ?
```

can benefit from an appropriate composite index.

The source audit specifically identifies missing indexes on:

``` text
Sandbox(project_id, expires_at)
Message(project_id, created_at)
```

fileciteturn1file0L553-L562

------------------------------------------------------------------------

# 27. Important Interview Concepts

## JWT

Know:

-   header
-   payload
-   signature
-   expiration
-   stateless authentication
-   cookie vs Authorization header

------------------------------------------------------------------------

## Bcrypt

Know:

-   hashing is one-way
-   salt
-   cost factor
-   password verification
-   why hashes must not be returned

------------------------------------------------------------------------

## HTTP-only Cookie

Know:

``` text
HttpOnly
Secure
SameSite
Max-Age / Expires
```

------------------------------------------------------------------------

## CORS

Know:

``` text
Origin
Preflight
OPTIONS
Access-Control-Allow-Origin
credentials
```

------------------------------------------------------------------------

## PostgreSQL Index

Know:

``` text
B-tree
composite index
index order
selectivity
EXPLAIN ANALYZE
```

------------------------------------------------------------------------

## Connection Pool

Know:

``` text
max connections
pool size
connection acquisition
connection release
pool exhaustion
PgBouncer
```

------------------------------------------------------------------------

## Horizontal Scaling

Know:

``` text
1 server
 ↓
N servers
```

requires externalizing state.

------------------------------------------------------------------------

## Queue

Know why asynchronous queues help:

``` text
HTTP request
 ↓
202 + job ID
 ↓
queue
 ↓
worker
```

instead of keeping the request open for a long-running operation.

------------------------------------------------------------------------

## SSE vs WebSocket

### SSE

Server → client streaming.

Good when the client mainly needs progress updates.

### WebSocket

Bidirectional communication.

Useful for interactive real-time communication.

For Vibe, either can be justified depending on the interaction model.

------------------------------------------------------------------------

# 28. Questions 81--88 --- Master Answers

# Q81. Explain your project architecture.

## 30-second answer

> "Vibe is an autonomous AI application development platform with a
> dual-backend architecture. Node.js and Express handle authentication,
> APIs, PostgreSQL persistence and E2B sandbox orchestration. A Python
> FastAPI service runs the LangGraph-based AI agent. When a user submits
> a prompt, the system ensures an isolated sandbox exists, sends the
> task to the agent, and the agent uses tools to inspect and modify
> files. The Node service executes those tools inside the sandbox and
> mirrors changes to PostgreSQL. Finally, a self-healing agent validates
> the Next.js server and attempts automatic repairs if compilation or
> runtime errors occur."

This answer is directly grounded in the analyzed architecture.
fileciteturn2file0L44-L63

------------------------------------------------------------------------

## 1-minute answer

> "At a high level, I separated Vibe into presentation, orchestration,
> reasoning and execution concerns. The Node.js/Express service is the
> main API and orchestration layer. It handles JWT authentication,
> request validation, project APIs, PostgreSQL through Prisma, E2B
> integration and internal tool endpoints. For long-running sandbox
> provisioning I use Inngest so infrastructure operations don't have to
> remain inside a normal request-response cycle. The AI reasoning layer
> is a Python FastAPI service using LangGraph. The agent maintains state
> and repeatedly decides whether it needs to read files, modify files or
> execute terminal commands. Those tools call back into the Node
> service, which has the E2B SDK and executes the operation inside the
> isolated sandbox. At the same time, generated files are persisted to
> PostgreSQL so that the project can be recreated even after a sandbox
> expires. Finally, the self-healing server checks the application using
> curl and feeds compilation errors back into the repair loop."

------------------------------------------------------------------------

## Follow-ups

### Why two backends?

Because the responsibilities are different:

``` text
Node → infrastructure/API/I/O
Python → AI/agent reasoning
```

### Why not microservices everywhere?

Because unnecessary service boundaries increase:

-   network calls
-   operational complexity
-   deployment complexity
-   debugging difficulty

Use separate services where there is a meaningful boundary.

------------------------------------------------------------------------

# Q82. What challenges did you face?

## Strong answer

> "The most interesting challenge was making AI-generated code reliably
> executable. In testing, the Next.js server could fail because old Node
> processes were still holding port 3000, the `.next` directory could
> have permission problems, or the model could import a package that
> wasn't installed. I built a self-healing control loop that cleans old
> processes, repairs the relevant permissions, starts the server and
> checks its health. It classifies common failures and handles
> deterministic cases such as missing dependencies directly, while
> sending actual code errors back to the LLM for repair. I also had to
> solve a streaming problem where XML-like file delimiters could be
> split across HTTP chunks, so I introduced an accumulator buffer."

The underlying challenges are documented in the source audit.
fileciteturn2file0L66-L85

------------------------------------------------------------------------

# Q83. How did you optimize your project?

## Strong answer

> "I optimized at several levels. First, I created a pre-baked sandbox
> image so common dependencies and the Next.js environment don't have to
> be installed from scratch every time. Second, I use PostgreSQL
> connection pooling. Third, the composite project-and-path uniqueness
> constraint allows atomic file upserts. Fourth, project listing queries
> only select required columns instead of loading large related data.
> Finally, the self-healing system uses deterministic pattern matching
> for missing dependencies, so it can install a package directly instead
> of spending an additional LLM inference cycle."

These are the optimizations identified as actually implemented in the
audit. fileciteturn2file0L88-L107

------------------------------------------------------------------------

# Q84. How would you scale your application?

## Strong answer

> "I would first make the existing bottlenecks asynchronous rather than
> simply adding servers. I would put the Node API behind a load balancer
> and keep the API tier stateless. Long-running AI generation should be
> represented as jobs consumed by agent workers, with progress delivered
> through SSE or WebSockets. PostgreSQL should be protected with proper
> indexes, connection pooling and read replicas where appropriate. Redis
> could be introduced for frequently accessed metadata and coordination.
> For E2B, I would enforce sandbox leases and aggressive idle cleanup
> because concurrent sandboxes are much more expensive than registered
> users. Finally, I would move large source blobs to object storage once
> PostgreSQL storage becomes a bottleneck."

The source audit proposes this direction for scaling.
fileciteturn2file0L110-L130

------------------------------------------------------------------------

# Q85. How would you handle millions of requests?

## Strong answer

> "I would separate user scale from execution scale. Millions of API
> requests should not result in millions of active sandboxes. The API
> tier would be horizontally scaled behind a load balancer, with Redis
> used selectively for caching and coordination, PostgreSQL deployed
> with a primary and read replicas, and long-running AI tasks placed on
> a queue. Source files would eventually move to object storage, while
> PostgreSQL stores metadata and references. I would also introduce LLM
> rate limiting and provider fallbacks because external model APIs
> become an important bottleneck at this scale."

The source analysis recommends object storage, replicas, pooling, LLM
routing and CDN-style delivery at very high scale.
fileciteturn2file0L133-L149

------------------------------------------------------------------------

# Q86. What design changes if traffic increases 10×?

## Strong answer

> "I would first identify the bottleneck with metrics. Based on the
> current implementation, I would prioritize removing the sandbox
> database polling loop, adding the missing composite indexes, improving
> file-write concurrency where safe, and protecting PostgreSQL
> connections. I would also fix correctness and security issues before
> scaling them. Then I would move long-running generation to an
> asynchronous job model and use SSE or WebSockets for progress rather
> than keeping HTTP requests open."

The original audit highlights polling, serial file writes and missing
indexes as important areas. fileciteturn2file0L152-L174

------------------------------------------------------------------------

# Q87. How do you debug production issues?

## Strong answer

> "I follow a hypothesis-driven incident process. First I determine the
> blast radius and stabilize the system. Then I trace the request across
> the Node service, Python agent, database and sandbox using logs and
> correlation IDs. For a generation failure, I would check the Express
> request, inspect the FastAPI/LangGraph execution, inspect sandbox logs
> such as the Next.js server log, and check database errors or
> constraints. Once I have the root cause, I reproduce it, add a
> regression test, deploy the fix safely and monitor the result."

The source audit recommends this approach and specifically identifies
Node, FastAPI, sandbox and database investigation points.
fileciteturn2file0L177-L196

------------------------------------------------------------------------

# Q88. What will you do if your code fails in production?

## Strong answer

> "My first priority is user impact, not debugging directly in
> production. If a deployment caused the problem, I would roll back or
> disable the affected feature if possible. Once the system is stable, I
> would inspect logs and traces, reproduce the failure in a controlled
> environment, fix it and add a regression test. Then I would deploy the
> fix through the normal release process and monitor it. Finally, I
> would conduct a blameless post-mortem to understand why the issue was
> not caught earlier and add an appropriate test, alert or deployment
> safeguard."

This follows the Mitigate → Investigate → Prevent model in the original
interview audit. fileciteturn2file0L198-L217

------------------------------------------------------------------------

# 29. Likely Interview Follow-ups

## Architecture

### "Why did you choose a dual-backend architecture?"

Answer:

> "Because the two services have different optimization requirements.
> The Node service is infrastructure and API oriented, while the Python
> service is agent and LLM oriented. Separating them also lets me scale
> the agent workers independently."

------------------------------------------------------------------------

### "Why not use only Python?"

> "It would be possible, but Node already provides a natural fit for the
> existing TypeScript API, Prisma ecosystem, HTTP streaming and E2B
> integration. Python gives us the strongest ecosystem for the agent
> layer."

------------------------------------------------------------------------

### "Why not use only Node?"

> "I could use LangChain/LangGraph alternatives in JavaScript, but
> Python provides a very mature ecosystem for the AI agent layer. The
> split is justified by the complexity of the agent workflow."

------------------------------------------------------------------------

## Database

### "Why PostgreSQL?"

> "The core entities are relational: users own projects, projects
> contain files and messages, and projects are associated with
> sandboxes. PostgreSQL gives strong consistency and relational
> constraints."

------------------------------------------------------------------------

### "Why store files in PostgreSQL?"

> "It simplifies persistence and rehydration during the prototype stage.
> The trade-off is that source blobs eventually make the relational
> database heavy, so at larger scale I would move content to object
> storage."

------------------------------------------------------------------------

### "What happens if two agents write the same file?"

This is a difficult follow-up.

The current unique constraint protects database uniqueness, but it does
**not automatically solve all concurrent editing semantics**.

A mature solution could use:

``` text
project-level distributed lock
       OR
optimistic versioning
       OR
single active generation per project
```

For example:

``` text
Project
 ↓
generation_version = 10

Agent reads version 10
 ↓
writes version 11

Second agent still has version 10
 ↓
reject / retry / merge
```

------------------------------------------------------------------------

## AI Agent

### "What if the LLM gets stuck?"

Use:

-   maximum iterations
-   timeout
-   token budget
-   tool-call limits
-   error classification
-   circuit breaker
-   cancellation

------------------------------------------------------------------------

### "What if the model repeatedly makes the wrong fix?"

A good response:

> "I would stop after a bounded number of repair attempts rather than
> allowing an infinite loop. I would preserve the error history, surface
> the failure to the user, and ideally create a versioned rollback point
> before automated modifications."

------------------------------------------------------------------------

### "How do you prevent the LLM from deleting the whole project?"

Defense in depth:

``` text
LLM policy
+
tool restrictions
+
filesystem sandbox
+
path validation
+
command allowlist
+
resource limits
+
versioning
```

------------------------------------------------------------------------

# 30. 60--90 Second Project Introduction

> "I'd like to talk about my project, Vibe. It's an autonomous
> AI-powered web development platform that takes a natural-language
> description of an application and turns it into a runnable Next.js
> project inside an isolated cloud environment.
>
> I designed it around a dual-backend architecture. The Node.js and
> Express service handles authentication, APIs, PostgreSQL persistence
> through Prisma, E2B sandbox management and internal tool execution.
> Separately, I built a Python FastAPI service using LangGraph, where
> the AI agent can inspect project files, execute terminal commands and
> create or modify files.
>
> One interesting architectural problem was that the sandbox is
> ephemeral, so I persist project files in PostgreSQL and rehydrate them
> into a new sandbox when necessary. I also built a self-healing
> development-server loop. After the AI modifies the application, the
> system checks the Next.js server, analyzes failures, automatically
> handles deterministic problems such as missing dependencies, and sends
> actual code errors back to the agent for repair.
>
> The project gave me practical experience with distributed services,
> agentic workflows, cloud sandboxing, database design, asynchronous
> processing and production-oriented reliability."

------------------------------------------------------------------------

# 31. One-Page Cheat Sheet

## Project

``` text
Vibe
AI-powered autonomous Next.js app builder
```

## Architecture

``` text
Client
 ↓
Node/Express
 ├── Auth
 ├── Project APIs
 ├── Prisma
 ├── E2B
 └── Tool Server
       ↑
       │ HTTP callbacks
       │
Python/FastAPI
 └── LangGraph Agent
       ↓
     E2B
```

## Database

``` text
User
 ↓
Project
 ├── File
 │    └── fileVersion
 ├── Message
 └── Sandbox

Template
 └── TemplateFile
```

## Ports

``` text
Client       3000
Node         5000
Python       8000
Sandbox      3000
```

## Agent Tools

``` text
terminal
read_files
create_or_update_files
```

## Self-Healing

``` text
start
 ↓
curl
 ↓
error?
 ↓
parse logs
 ↓
missing package → npm install
code error      → LLM repair
 ↓
retry
 ↓
max 10
```

## Biggest Challenges

``` text
EADDRINUSE
EACCES
missing dependencies
streaming chunk fragmentation
sandbox provisioning latency
```

## Actual Optimizations

``` text
pre-baked Docker image
connection pooling
composite unique file key
selective DB projection
deterministic dependency installation
```

## Important Current Weaknesses

``` text
assistant enum mismatch
tool endpoint authorization
command injection
password hash exposure
polling
missing indexes
incomplete frontend
```

## Best Interview Topics

``` text
LangGraph
E2B / sandbox isolation
Inngest
Prisma
PostgreSQL
JWT
bcrypt
HTTP-only cookies
CORS
IDOR
command injection
path traversal
Redis
queues
SSE
WebSockets
horizontal scaling
connection pooling
database indexes
Linux processes
Docker permissions
HTTP streaming
production debugging
```

------------------------------------------------------------------------

# 32. Top 30 Topics to Study

## Highest Priority

### 1. LangGraph StateGraph

Understand:

``` text
State
Nodes
Edges
Conditional edges
ToolNode
START
END
```

------------------------------------------------------------------------

### 2. ReAct Agents

Understand:

``` text
Reason
 ↓
Act
 ↓
Observe
 ↓
Reason
```

------------------------------------------------------------------------

### 3. Tool Calling

Know how an LLM selects a tool and how the tool result becomes part of
the next model input.

------------------------------------------------------------------------

### 4. E2B / MicroVM Isolation

Know:

-   why isolation matters
-   ephemeral execution
-   resource limits
-   filesystem
-   networking
-   lifecycle

------------------------------------------------------------------------

### 5. Inngest / Durable Workflows

Know:

-   events
-   steps
-   retries
-   idempotency
-   asynchronous processing

------------------------------------------------------------------------

### 6. PostgreSQL Indexes

Especially:

``` text
(project_id, expires_at)
(project_id, created_at)
```

Understand index order and `EXPLAIN ANALYZE`.

------------------------------------------------------------------------

### 7. Connection Pooling

Know:

``` text
pool
connection limit
timeouts
pool exhaustion
PgBouncer
```

------------------------------------------------------------------------

### 8. JWT

Understand:

``` text
header
payload
signature
expiry
verification
```

------------------------------------------------------------------------

### 9. Cookie Security

Know:

``` text
HttpOnly
Secure
SameSite
CSRF
expiration
```

------------------------------------------------------------------------

### 10. bcrypt

Know:

-   salt
-   cost factor
-   hashing vs encryption
-   password verification

------------------------------------------------------------------------

## Backend

11. Express middleware\
12. REST API design\
13. HTTP status codes\
14. CORS\
15. FastAPI / ASGI\
16. Python asyncio\
17. Node.js event loop\
18. Axios / HTTPX\
19. error handling\
20. graceful shutdown

------------------------------------------------------------------------

## Linux / Containers

21. Docker\
22. file permissions\
23. `chmod`\
24. `chown`\
25. `kill`, `pkill`, `fuser`, `lsof`\
26. ports and `EADDRINUSE`\
27. processes and child processes

------------------------------------------------------------------------

## System Design

28. Load balancing\
29. Redis + queues + workers\
30. Horizontal scaling + database replicas

------------------------------------------------------------------------

# Final Interview Strategy

The most important thing is **not memorizing this README
word-for-word**.

You should be able to explain this chain naturally:

``` text
User prompt
    ↓
Express API
    ↓
Authentication
    ↓
Find / create sandbox
    ↓
Inngest if provisioning is required
    ↓
Project rehydration
    ↓
Python LangGraph agent
    ↓
Tool callback to Node
    ↓
E2B execution
    ↓
File persistence
    ↓
Next.js health check
    ↓
Self-healing if necessary
    ↓
Working preview
```

If you can explain that flow clearly, you can handle a large portion of
the architecture questions.

Then learn the **four critical weaknesses** well:

``` text
1. Message enum mismatch
2. Tool endpoint authorization
3. Shell command injection
4. Password hash exposure
```

A strong interviewer may deliberately discover one of these and ask:

> "You said you built this. Did you notice this problem?"

The best answer is not to defend the bug.

Say:

> **"Yes, this is a weakness in the current implementation. The problem
> is X, the impact is Y, and I would fix it using Z."**

That demonstrates engineering maturity.

------------------------------------------------------------------------

## Source / Scope Note

This README is based primarily on the technical project audit supplied
from the Vibe codebase. Claims marked as current implementation are
derived from that audit. The scalability, production-hardening and
improvement sections extend those findings with standard engineering
practices and are intended as **future-design/interview discussion**,
not claims that those features are already implemented. The supplied
audit covers the project overview, architecture, database, security,
APIs, algorithms, optimization, scalability, production gaps,
challenges, weaknesses and interview questions.
fileciteturn1file0L12-L42 fileciteturn1file0L553-L586
