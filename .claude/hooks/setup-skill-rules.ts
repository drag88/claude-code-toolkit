#!/usr/bin/env tsx

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

interface SkillRule {
  type: string;
  enforcement: string;
  priority: string;
  description: string;
  promptTriggers: {
    keywords: string[];
    intentPatterns: string[];
  };
}

interface SkillRulesConfig {
  version: string;
  skills: Record<string, SkillRule>;
}

interface ProjectAnalysis {
  dependencies: string[];
  structure: string[];
  projectType: string[];
  readme: string;
  existingSkills: string[];
  detectedTechnologies: string[];
}

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const skillRulesPath = join(projectDir, '.claude', 'skills', 'skill-rules.json');
const skillsDir = join(projectDir, '.claude', 'skills');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function printHeader(text: string) {
  console.log(`\n${colors.cyan}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}🎯 ${text}${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

function printSection(title: string) {
  console.log(`\n${colors.blue}${colors.bright}📚 ${title}${colors.reset}`);
}

function printInfo(text: string) {
  console.log(`${colors.green}  → ${text}${colors.reset}`);
}

function printWarning(text: string) {
  console.log(`${colors.yellow}  ⚠️  ${text}${colors.reset}`);
}

// Analyze project dependencies
function analyzeDependencies(): string[] {
  const deps: string[] = [];

  // Check package.json
  const packageJsonPath = join(projectDir, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };
      deps.push(...Object.keys(allDeps));
    } catch (error) {
      // Silently skip if can't parse
    }
  }

  // Check pyproject.toml
  const pyprojectPath = join(projectDir, 'pyproject.toml');
  if (existsSync(pyprojectPath)) {
    try {
      const content = readFileSync(pyprojectPath, 'utf-8');
      const depMatches = content.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
      if (depMatches) {
        const depList = depMatches[1].match(/"([^"]+)"/g);
        if (depList) {
          deps.push(...depList.map(d => d.replace(/"/g, '').split(/[>=<~]/)[0]));
        }
      }
    } catch (error) {
      // Silently skip
    }
  }

  // Check requirements.txt
  const requirementsPath = join(projectDir, 'requirements.txt');
  if (existsSync(requirementsPath)) {
    try {
      const content = readFileSync(requirementsPath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
      deps.push(...lines.map(l => l.split(/[>=<~]/)[0].trim()));
    } catch (error) {
      // Silently skip
    }
  }

  return [...new Set(deps)];
}

// Analyze project structure
function analyzeStructure(): string[] {
  const structure: string[] = [];

  try {
    const entries = readdirSync(projectDir);

    for (const entry of entries) {
      const fullPath = join(projectDir, entry);
      if (statSync(fullPath).isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        structure.push(entry);
      }
    }
  } catch (error) {
    // Silently skip
  }

  return structure;
}

// Detect existing skills
function detectExistingSkills(): string[] {
  const skills: string[] = [];

  if (existsSync(skillsDir)) {
    try {
      const entries = readdirSync(skillsDir);
      for (const entry of entries) {
        if (entry.endsWith('.md') || entry.endsWith('.json')) {
          skills.push(entry.replace(/\.(md|json)$/, ''));
        }
      }
    } catch (error) {
      // Silently skip
    }
  }

  return skills.filter(s => s !== 'skill-rules');
}

// Read README for project context
function readReadme(): string {
  const readmePath = join(projectDir, 'README.md');
  if (existsSync(readmePath)) {
    try {
      return readFileSync(readmePath, 'utf-8').slice(0, 2000); // First 2000 chars
    } catch (error) {
      return '';
    }
  }
  return '';
}

// Detect technologies from dependencies
function detectTechnologies(deps: string[]): string[] {
  const techMap: Record<string, string[]> = {
    'react': ['React', 'Frontend', 'UI'],
    'vue': ['Vue.js', 'Frontend', 'UI'],
    'angular': ['Angular', 'Frontend', 'UI'],
    'svelte': ['Svelte', 'Frontend', 'UI'],
    'next': ['Next.js', 'React', 'Frontend', 'SSR'],
    'nuxt': ['Nuxt.js', 'Vue.js', 'Frontend', 'SSR'],
    'express': ['Express', 'Backend', 'API'],
    'fastapi': ['FastAPI', 'Python', 'Backend', 'API'],
    'django': ['Django', 'Python', 'Backend', 'Web Framework'],
    'flask': ['Flask', 'Python', 'Backend', 'Web Framework'],
    'nest': ['NestJS', 'Backend', 'API'],
    'typescript': ['TypeScript', 'Type Safety'],
    'jest': ['Jest', 'Testing'],
    'pytest': ['Pytest', 'Testing', 'Python'],
    'vitest': ['Vitest', 'Testing'],
    'playwright': ['Playwright', 'E2E Testing'],
    'cypress': ['Cypress', 'E2E Testing'],
    'tailwind': ['TailwindCSS', 'Styling', 'UI'],
    'pandas': ['Pandas', 'Data Science', 'Python'],
    'numpy': ['NumPy', 'Data Science', 'Python'],
    'tensorflow': ['TensorFlow', 'Machine Learning', 'AI'],
    'pytorch': ['PyTorch', 'Machine Learning', 'AI'],
    'scikit-learn': ['Scikit-learn', 'Machine Learning', 'Python'],
  };

  const detected: Set<string> = new Set();

  for (const dep of deps) {
    const depLower = dep.toLowerCase();
    for (const [key, techs] of Object.entries(techMap)) {
      if (depLower.includes(key)) {
        techs.forEach(t => detected.add(t));
      }
    }
  }

  return Array.from(detected);
}

// Infer project type from structure and dependencies
function inferProjectType(structure: string[], technologies: string[]): string[] {
  const types: Set<string> = new Set();

  // From structure
  const structureMap: Record<string, string> = {
    'frontend': 'Frontend',
    'backend': 'Backend',
    'api': 'API',
    'tests': 'Testing',
    'docs': 'Documentation',
    'scripts': 'Automation',
    'database': 'Database',
    'migrations': 'Database',
  };

  for (const dir of structure) {
    const dirLower = dir.toLowerCase();
    for (const [key, type] of Object.entries(structureMap)) {
      if (dirLower.includes(key)) {
        types.add(type);
      }
    }
  }

  // From technologies
  if (technologies.some(t => ['React', 'Vue.js', 'Angular', 'Svelte'].includes(t))) {
    types.add('Frontend');
  }
  if (technologies.some(t => ['Backend', 'API'].includes(t))) {
    types.add('Backend');
  }
  if (technologies.some(t => ['Data Science', 'Machine Learning', 'AI'].includes(t))) {
    types.add('Data Science');
  }
  if (technologies.some(t => ['Testing'].includes(t))) {
    types.add('Testing');
  }

  return Array.from(types);
}

// Perform full project analysis
function analyzeProject(): ProjectAnalysis {
  const dependencies = analyzeDependencies();
  const structure = analyzeStructure();
  const readme = readReadme();
  const existingSkills = detectExistingSkills();
  const detectedTechnologies = detectTechnologies(dependencies);
  const projectType = inferProjectType(structure, detectedTechnologies);

  return {
    dependencies,
    structure,
    projectType,
    readme,
    existingSkills,
    detectedTechnologies,
  };
}

// Generate skill rules based on analysis
function generateSkillRules(analysis: ProjectAnalysis, userGoals: string): SkillRulesConfig {
  const skills: Record<string, SkillRule> = {};

  // Add skills based on detected technologies
  const techSkillMap: Record<string, Partial<SkillRule>> = {
    'Frontend': {
      type: 'domain',
      enforcement: 'recommend',
      priority: 'high',
      description: 'Frontend development with modern frameworks and UI components',
      promptTriggers: {
        keywords: ['ui', 'component', 'frontend', 'interface', 'design', 'layout', 'styling'],
        intentPatterns: [
          '(create|build|design).*?(ui|interface|component|page|view)',
          '(style|css|layout).*?(component|page)',
        ],
      },
    },
    'Backend': {
      type: 'domain',
      enforcement: 'recommend',
      priority: 'high',
      description: 'Backend development with APIs, databases, and server logic',
      promptTriggers: {
        keywords: ['api', 'backend', 'server', 'endpoint', 'database', 'query', 'model'],
        intentPatterns: [
          '(create|build|implement).*?(api|endpoint|route|controller)',
          '(database|db|query|model).*?(create|update|query)',
        ],
      },
    },
    'Testing': {
      type: 'quality',
      enforcement: 'suggest',
      priority: 'medium',
      description: 'Testing strategies and test automation',
      promptTriggers: {
        keywords: ['test', 'testing', 'spec', 'unit test', 'integration test', 'e2e'],
        intentPatterns: [
          '(write|create|add).*?(test|spec)',
          '(test|verify|validate).*?(functionality|behavior)',
        ],
      },
    },
    'Data Science': {
      type: 'domain',
      enforcement: 'recommend',
      priority: 'high',
      description: 'Data analysis, visualization, and machine learning',
      promptTriggers: {
        keywords: ['data', 'analysis', 'visualization', 'model', 'training', 'ml', 'ai'],
        intentPatterns: [
          '(analyze|visualize|plot).*?(data|dataset)',
          '(train|build|create).*?(model|ml|ai)',
        ],
      },
    },
  };

  // Add skills for detected project types
  for (const type of analysis.projectType) {
    if (techSkillMap[type]) {
      skills[type.toLowerCase().replace(/\s+/g, '-')] = techSkillMap[type] as SkillRule;
    }
  }

  // Add skills for existing skill definitions
  for (const skillName of analysis.existingSkills) {
    if (!skills[skillName]) {
      skills[skillName] = {
        type: 'custom',
        enforcement: 'suggest',
        priority: 'medium',
        description: `Custom skill: ${skillName}`,
        promptTriggers: {
          keywords: [skillName.replace(/-/g, ' ')],
          intentPatterns: [],
        },
      };
    }
  }

  return {
    version: '1.0.0',
    skills,
  };
}

// Check if skill rules need update
function needsUpdate(analysis: ProjectAnalysis): boolean {
  if (!existsSync(skillRulesPath)) {
    return true;
  }

  try {
    const existing = JSON.parse(readFileSync(skillRulesPath, 'utf-8')) as SkillRulesConfig;
    const existingSkillNames = new Set(Object.keys(existing.skills));

    // Check if new project types detected
    const detectedSkillNames = new Set(
      analysis.projectType.map(t => t.toLowerCase().replace(/\s+/g, '-'))
    );

    for (const skillName of detectedSkillNames) {
      if (!existingSkillNames.has(skillName)) {
        return true;
      }
    }

    // Check if new existing skills found
    for (const skillName of analysis.existingSkills) {
      if (!existingSkillNames.has(skillName)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    return true; // If can't parse, assume needs update
  }
}

// Main execution
async function main() {
  printHeader('SKILL RULES SETUP');

  // Analyze project
  printSection('Analyzing Project');
  const analysis = analyzeProject();

  if (analysis.projectType.length > 0) {
    printInfo(`Detected project types: ${analysis.projectType.join(', ')}`);
  }
  if (analysis.detectedTechnologies.length > 0) {
    printInfo(`Detected technologies: ${analysis.detectedTechnologies.slice(0, 5).join(', ')}${analysis.detectedTechnologies.length > 5 ? '...' : ''}`);
  }
  if (analysis.existingSkills.length > 0) {
    printInfo(`Found existing skills: ${analysis.existingSkills.join(', ')}`);
  }

  // Check if update needed
  const updateNeeded = needsUpdate(analysis);

  if (!updateNeeded) {
    printInfo('Skill rules are up to date');
    console.log(''); // Empty line for clean output
    return;
  }

  // Prompt for setup/update
  printSection(existsSync(skillRulesPath) ? 'Update Available' : 'Initial Setup');

  if (existsSync(skillRulesPath)) {
    console.log(`${colors.yellow}New project capabilities detected. Consider updating skill rules.${colors.reset}\n`);
    console.log(`${colors.magenta}ACTION: Ask user if they want to update skill-rules.json${colors.reset}`);
    console.log(`${colors.magenta}        Use AskUserQuestion or similar interactive approach${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}No skill rules found. Setting up for the first time.${colors.reset}\n`);
    console.log(`${colors.magenta}ACTION: Ask user about project goals and generate skill-rules.json${colors.reset}`);
    console.log(`${colors.magenta}        Suggested questions:${colors.reset}`);
    console.log(`${colors.magenta}        1. What is the main purpose of this project?${colors.reset}`);
    console.log(`${colors.magenta}        2. What are the primary workflows?${colors.reset}`);
    console.log(`${colors.magenta}        3. Which detected skills should be enabled?${colors.reset}\n`);

    // For now, generate with detected info (Claude will handle interactive Q&A)
    printSection('Generating Skill Rules');
    const skillRules = generateSkillRules(analysis, 'Auto-detected configuration');

    // Ensure directory exists
    if (!existsSync(skillsDir)) {
      mkdirSync(skillsDir, { recursive: true });
    }

    // Write skill rules
    writeFileSync(skillRulesPath, JSON.stringify(skillRules, null, 2), 'utf-8');
    printInfo(`Created: ${skillRulesPath}`);
    printInfo(`Configured ${Object.keys(skillRules.skills).length} skills based on project analysis`);
  }

  console.log(''); // Empty line for clean output
}

main().catch(error => {
  console.error(`${colors.yellow}⚠️  Error during skill rules setup:${colors.reset}`, error.message);
  process.exit(0); // Don't fail the hook
});
