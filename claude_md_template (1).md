# Claude Code Context - [PROJECT NAME]

## Project Overview

**[Project Name]** - [Brief 1-2 sentence description of what this project does]

### Key Goals
- [Goal 1]
- [Goal 2]
- [Goal 3]

### Project Type
[Specify: Mobile App / Web Application / Backend Service / Library / Desktop Application / etc.]

## Current Status

- **Branch**: [current branch name]
- **Phase**: [Current phase or milestone]
- **Last Feature Completed**: [Feature name] ✓ 
- **Next Feature**: [Feature name]
- **Current Focus**: [What you're actively working on]
- **Tests**: [X passing / Y total] or [Manual testing only]

## Technology Stack

**[Fill in your specific stack]**

Example format:
- **Framework**: [e.g., React Native, .NET 8, Django, etc.]
- **Language**: [e.g., Kotlin, TypeScript, Python, C#]
- **UI**: [e.g., Jetpack Compose, React, Vue, etc.]
- **Database**: [e.g., PostgreSQL, MongoDB, SQLite, None for POC]
- **Testing**: [e.g., Jest, JUnit, pytest, Manual testing]
- **Build Tools**: [e.g., Gradle, npm, dotnet CLI]
- **Other Key Libraries**: [List important dependencies]

## Development Environment

**[Specify your development environment]**

Example format:
- **OS**: [e.g., Windows, macOS, Linux, WSL]
- **IDE**: [e.g., Android Studio, VS Code, Visual Studio, IntelliJ]
- **Path Conventions**: [e.g., WSL paths, Windows paths]
- **Repository Location**: [e.g., `/mnt/c/repos/project-name` or `C:\repos\project-name`]
- **Special Setup**: [e.g., Requires Docker, Android emulator, specific SDK versions]

## Project Structure

```
[PROJECT-ROOT]/
├── [folder1]/           # [Description]
├── [folder2]/           # [Description]
├── [folder3]/           # [Description]
└── [folder4]/           # [Description]
```

**[Describe your project's directory structure and organization]**

## Architecture & Design Principles

**[Define your architectural approach]**

Example areas to cover:
- **Architecture Pattern**: [e.g., MVVM, Clean Architecture, MVC, Microservices]
- **Design Principles**: [e.g., SOLID, DRY, KISS]
- **Key Patterns**: [e.g., Repository, Factory, Observer, Singleton]
- **Code Organization**: [How code should be structured]

## Testing Strategy

**Approach:** [Specify your testing approach for this project]

Options to consider:
- **Test-Driven Development (TDD)** - Write tests before implementation
- **Test After Implementation** - Write tests after features work
- **Manual Testing Primarily** - Automated tests only for critical paths
- **No Formal Testing for POC** - Focus on getting it working first

**Current Project Approach:** [FILL THIS IN]

### Test Requirements (if applicable)
- [e.g., Minimum code coverage percentage]
- [e.g., Unit tests required for all business logic]
- [e.g., Integration tests for API endpoints]
- [e.g., Manual test checklist before merging]

## Development Workflow

### For Each Feature/Task

**This workflow is MANDATORY for all development work on this project.**

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/feature-name
   # or: git checkout -b bugfix/bug-name
   # or: git checkout -b refactor/refactor-name
   ```

2. **Create or Review Feature Plan** (if applicable)
   - Location: `/docs/feature-plans/` or `/docs/tasks/`
   - Document should include:
     - Feature description and requirements
     - Implementation approach
     - Acceptance criteria
     - Notes section for implementation progress

3. **Implement Feature Using Incremental Commits**
   
   **CRITICAL: Do NOT wait until the entire feature is complete to commit!**
   
   After completing each logical stage/step:
   
   **a. Update Documentation**
   - Update the feature plan/task document with:
     - What was just completed
     - Any decisions made
     - Any deviations from original plan
     - Discoveries or learnings
     - Next steps
   - Keep a running history of progress
   
   **b. Commit Code + Documentation Together**
   - Each commit should include:
     - The code changes for that logical unit
     - Updated documentation reflecting those changes
   - Write clear, descriptive commit messages
   
   **c. Ensure Commit is Complete**
   - Code compiles/builds successfully
   - Tests pass (if test-driven approach)
   - No broken functionality
   - Represents a complete unit of work

   **Examples of Good Commit Points:**
   - After creating a new model/class with basic structure
   - After implementing a specific method with tests
   - After adding validation logic
   - After implementing a UI component
   - After integrating with an API
   - After adding error handling to a section
   - After completing a refactoring step
   
   **What Makes a Good Incremental Commit:**
   - ✅ Builds successfully
   - ✅ Tests pass (if tests exist)
   - ✅ Represents one logical change
   - ✅ Has descriptive commit message
   - ✅ Includes updated documentation
   - ✅ Could be code reviewed independently
   - ✅ Doesn't break existing functionality
   
   **What is TOO SMALL for a commit:**
   - ❌ Changing a single variable name (unless it's a dedicated refactoring)
   - ❌ Adding a single import statement
   - ❌ Fixing a typo in a comment
   
   **What is TOO LARGE for a commit:**
   - ❌ "Implemented entire feature"
   - ❌ Multiple unrelated changes
   - ❌ Changes spanning multiple components without logical grouping

4. **Before Creating Pull Request**
   - Review all Quality Gates (see below)
   - Ensure feature plan is marked complete
   - Update deliverables checklist
   - Run final build and test suite
   - Check for any warnings or linting issues

5. **Create Pull Request**
   - Title: Clear, descriptive summary
   - Description: Link to feature plan, describe changes, note any special considerations
   - Request review from appropriate team members (if applicable)

6. **Address Review Feedback**
   - Make requested changes
   - Continue incremental commit pattern for review fixes
   - Update PR with responses to comments

7. **Merge After Approval**
   - Ensure all checks pass
   - Merge to main/master branch
   - Delete feature branch
   - Update project status in this document

### Commit Message Guidelines

**Format:**
```
[Type] Brief description

Optional detailed description if needed.
```

**Types:**
- `[Feature]` - New functionality
- `[Fix]` - Bug fixes
- `[Test]` - Adding or updating tests
- `[Refactor]` - Code improvements without functionality change
- `[Docs]` - Documentation updates
- `[Setup]` - Project configuration changes
- `[Style]` - Formatting, UI/UX changes

**Examples:**
```
[Feature] Add user authentication with email/password

Implemented login and registration screens with form validation.
Integrated with Firebase Authentication backend.
Added tests for validation logic.

[Fix] Correct date formatting in export function

Fixed bug where dates were exported in wrong timezone.
Added test to verify timezone handling.

[Refactor] Extract mesh loading logic to separate service

Moved Filament mesh loading from ViewModel to MeshLoaderService
to improve separation of concerns and testability.
```

## Quality Gates (Before Merge)

**All items must be checked before merging to main branch:**

### Code Quality
- [ ] All code builds/compiles without errors
- [ ] No compiler warnings
- [ ] Code follows project conventions and style guide
- [ ] No commented-out code or debugging statements
- [ ] No hardcoded values that should be configurable

### Testing
- [ ] All existing tests still pass
- [ ] New tests added for new functionality (if testing approach requires it)
- [ ] Manual testing completed (if applicable)
- [ ] Edge cases considered and tested

### Documentation
- [ ] Code comments added for complex logic
- [ ] Public APIs/methods documented (if applicable)
- [ ] README updated if needed
- [ ] Feature plan/task marked complete
- [ ] Implementation notes captured

### Architecture
- [ ] Design principles followed
- [ ] No unnecessary dependencies introduced
- [ ] Proper error handling implemented
- [ ] Logging added appropriately (if applicable)
- [ ] Performance considerations addressed

### Git Hygiene
- [ ] Commits are incremental and logical
- [ ] Commit messages are clear and descriptive
- [ ] No merge conflicts
- [ ] Feature branch is up to date with main

## Working Principles

**How Claude Code Should Approach This Project:**

1. **Incremental Development**
   - Break work into small, testable units
   - Commit frequently with documentation updates
   - Each commit should represent a complete, working change
   - Never wait until a feature is "done" to commit

2. **Documentation-Driven**
   - Update documentation with every commit
   - Document decisions and rationale
   - Keep feature plans/tasks up to date
   - Maintain this claude.md file

3. **Quality-Focused**
   - Follow quality gates before merging
   - Write clean, maintainable code
   - Consider edge cases and error scenarios
   - Test thoroughly (per project's testing strategy)

4. **Clear Communication**
   - Ask clarifying questions when requirements are ambiguous
   - Reference specific line numbers when discussing code
   - Explain technical decisions
   - Highlight potential issues or trade-offs

5. **Architecture-Aware**
   - Follow established patterns consistently
   - Respect separation of concerns
   - Consider maintainability and extensibility
   - Don't over-engineer for current requirements

6. **Context-Aware**
   - Read relevant documentation before implementing
   - Understand existing code patterns
   - Check for similar implementations elsewhere
   - Consider how changes affect the broader system

## Anti-Patterns to Avoid

**Common Mistakes That Cause Problems:**

1. **Large, Monolithic Commits**
   - ❌ Implementing an entire feature in one giant commit
   - ✅ Break work into logical, reviewable chunks

2. **Implementation Without Understanding**
   - ❌ Writing code without reading existing patterns
   - ✅ Review existing code and documentation first

3. **Skipping Documentation**
   - ❌ "I'll document it later" (it never happens)
   - ✅ Update docs with each commit

4. **Incomplete Error Handling**
   - ❌ Happy path only implementations
   - ✅ Consider and handle error scenarios

5. **Ignoring Quality Gates**
   - ❌ "Tests can wait" or "I'll fix warnings later"
   - ✅ Meet quality standards before merging

6. **Over-Engineering**
   - ❌ Building elaborate abstractions for simple requirements
   - ✅ Solve the current problem appropriately

7. **Copy-Paste Without Understanding**
   - ❌ Copying code snippets without understanding them
   - ✅ Understand what code does before using it

8. **Making Assumptions**
   - ❌ Guessing at requirements or architectural decisions
   - ✅ Ask clarifying questions

## Important Files & Locations

**[Document your project's key files and their purposes]**

Example format:
- **Main Documentation**: `/docs/[filename].md` - [Purpose]
- **Architecture Decisions**: `/docs/architecture/` - [Purpose]
- **Feature Plans**: `/docs/feature-plans/` - [Purpose]
- **Configuration**: `[path]` - [Purpose]
- **Tests**: `[path]` - [Purpose]

## Current Development Context

### What We're Working On
[Describe the current focus, recent changes, or context that Claude should be aware of]

### Recent Decisions
[Document any important architectural or technical decisions made recently]

### Known Issues
[List any known bugs, technical debt, or areas that need attention]

### Next Steps
1. [Next task or feature]
2. [Following task]
3. [Future consideration]

## Project-Specific Notes

**[Add any project-specific guidance, conventions, or context]**

Example areas:
- Naming conventions
- Code style specifics
- Integration points
- External dependencies
- Performance requirements
- Security considerations
- Deployment process

## Configuration & Settings

**[Document configuration approach]**

Example:
- Configuration files: [Location and format]
- Environment variables: [List required vars]
- Secrets management: [How secrets are handled]
- Build configuration: [Important build settings]

## Common Commands

**[List frequently used commands for this project]**

Example:
```bash
# Build the project
[command]

# Run tests
[command]

# Start development server
[command]

# Deploy/package
[command]

# Other common tasks
[command]
```

## Resources & References

**[Add links to important resources]**

Example:
- Project repository: [URL]
- Documentation: [URL]
- Design files: [URL]
- API documentation: [URL]
- External libraries: [URLs with descriptions]

---

**Last Updated**: [Date]
**Current Phase**: [Phase name]
**Framework/Platform**: [Technology stack summary]
**Status**: [Overall project status]
