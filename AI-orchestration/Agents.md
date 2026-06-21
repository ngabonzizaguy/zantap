You are an AI architect specialized in building agent-driven development environments.



Your task is to convert this repository into an AI-agent-enabled workspace that works with Cursor (you), Windsurf, Claude Code, and Antigravity.



\------------------------------------------------



1\. CREATE AGENT ARCHITECTURE



Create the following directories:



.cursor/skills/

agents/

context/



\------------------------------------------------



2\. CREATE SUB AGENTS



Create specialized AI agents:



Project Manager Agent

Backend Engineer Agent

Frontend Engineer Agent

Testing Agent

DevOps Agent

Documentation Agent



Each agent should have:



role

responsibilities

activation conditions

workflow steps



\------------------------------------------------



3\. CREATE SKILLS



Create reusable skills inside:



.cursor/skills/



Skills required:



repository-analyzer

feature-builder

api-integration

bug-investigator

refactor-assistant

test-generator

documentation-writer



Each skill must include:



name

description

when to activate

step-by-step execution plan



\------------------------------------------------



4\. GENERATE CONTEXT FILES



Create context files inside:



context/



Include:



project-overview.md

architecture.md

tech-stack.md

coding-standards.md



These files must summarize the repository and guide all agents.



\------------------------------------------------



5\. AGENT ORCHESTRATION



Create AGENTS.md that explains:



how tasks are delegated

which agents handle which tasks

how skills are triggered



\------------------------------------------------



6\. TASK EXECUTION RULES



Agents must:



analyze repository

plan before coding

generate structured commits

follow architecture patterns

avoid modifying unrelated modules



\------------------------------------------------



7\. ALWAYS LOAD CONTEXT



Before executing any task the AI must:



read



context/project-overview.md

context/architecture.md

context/tech-stack.md

context/coding-standards.md



This ensures all agents understand the full system architecture before making changes.



\------------------------------------------------



8\. AUTOMATIC REPOSITORY ANALYZER



Create a skill called repository-analyzer.



This skill must automatically:



scan repository structure

detect programming languages

identify frameworks

identify architecture patterns

generate architecture diagrams

produce repository summaries



This skill should activate automatically when the repository changes or when a new workspace is opened.



\------------------------------------------------



9\. SELF DOCUMENTATION



After completing any feature or modification the agents must:



update documentation

update architecture files

update README if needed



\------------------------------------------------



10\. PARALLEL AGENTS



The system must support multiple agents working simultaneously:



frontend agent

backend agent

testing agent



The project manager agent coordinates them.



\------------------------------------------------



11\. ADVANCED TRICK (GLOBAL MEMORY SYSTEM)



Implement a long-term AI memory system:



Create a folder:



.ai-memory/



Inside it store:



decisions.md

architecture-decisions.md

lessons-learned.md

agent-notes.md



Agents must continuously update this memory after tasks.



This allows future sessions to retain knowledge of the system.



\------------------------------------------------



12\. FINAL OUTPUT



Generate all folders and files needed for this system and populate them with high quality templates.

