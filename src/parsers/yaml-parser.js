import * as jsyaml from 'js-yaml';
import { findLineNumber } from './parser-utils.js';

/**
 * Parses a CircleCI config.yml content.
 * @param {string} content - Raw YAML string.
 * @returns {object} Normalized CircleCI AST.
 */
export function parseCircleCI(content) {
  const result = {
    type: 'circleci',
    version: null,
    orbs: [],
    jobs: [],
    workflows: [],
    executors: [],
    errors: []
  };

  if (!content || !content.trim()) {
    result.errors.push({
      severity: 'error',
      message: 'File content is empty.',
      line: 1,
      suggestion: 'Please paste or upload a valid CircleCI config.yml file.'
    });
    return result;
  }

  let doc;
  try {
    doc = jsyaml.load(content);
  } catch (err) {
    // Attempt to extract line number from js-yaml error
    let line = 1;
    if (err.mark && err.mark.line) {
      line = err.mark.line + 1;
    }
    result.errors.push({
      severity: 'error',
      message: `YAML parsing failed: ${err.reason || err.message}`,
      line: line,
      suggestion: 'Check for indentation issues, tabs, or missing colons.'
    });
    return result;
  }

  if (typeof doc !== 'object' || doc === null) {
    result.errors.push({
      severity: 'error',
      message: 'Invalid CircleCI structure. Must be a YAML dictionary.',
      line: 1,
      suggestion: 'Ensure the top level contains CircleCI keys such as "version", "jobs", etc.'
    });
    return result;
  }

  // 1. Version
  result.version = doc.version ? String(doc.version) : null;
  if (!result.version) {
    result.errors.push({
      severity: 'warning',
      message: 'CircleCI version not specified.',
      line: 1,
      suggestion: 'Add "version: 2.1" at the top of the file.'
    });
  } else if (result.version !== '2.1' && result.version !== '2') {
    result.errors.push({
      severity: 'warning',
      message: `Unsupported CircleCI version: ${result.version}. Recommended version is 2.1.`,
      line: findLineNumber(content, `version:`),
      suggestion: 'Change version to 2.1 to enable modern features.'
    });
  }

  // 2. Orbs
  if (doc.orbs && typeof doc.orbs === 'object') {
    Object.entries(doc.orbs).forEach(([name, orbVal]) => {
      const orbStr = typeof orbVal === 'string' ? orbVal : JSON.stringify(orbVal);
      result.orbs.push({
        name,
        ref: orbStr,
        line: findLineNumber(content, `${name}:`)
      });
    });
  }

  // 3. Executors
  if (doc.executors && typeof doc.executors === 'object') {
    Object.entries(doc.executors).forEach(([name, execVal]) => {
      let type = 'unknown';
      let image = '';
      if (execVal.docker) {
        type = 'docker';
        const d = execVal.docker;
        if (Array.isArray(d) && d.length > 0) {
          image = typeof d[0] === 'object' ? d[0].image : String(d[0]);
        } else if (typeof d === 'object') {
          image = d.image || '';
        }
      } else if (execVal.machine) {
        type = 'machine';
        image = typeof execVal.machine === 'object' ? execVal.machine.image : String(execVal.machine);
      } else if (execVal.macos) {
        type = 'macos';
        image = execVal.macos.xcode || '';
      }

      result.executors.push({
        name,
        type,
        image,
        line: findLineNumber(content, `${name}:`, findLineNumber(content, 'executors:'))
      });
    });
  }

  // 4. Jobs
  if (!doc.jobs || typeof doc.jobs !== 'object') {
    result.errors.push({
      severity: 'error',
      message: 'No jobs defined in CircleCI configuration.',
      line: 1,
      suggestion: 'Create a "jobs" block with at least one build job.'
    });
  } else {
    Object.entries(doc.jobs).forEach(([jobName, jobData]) => {
      if (!jobData || typeof jobData !== 'object') {
        result.errors.push({
          severity: 'error',
          message: `Job "${jobName}" is invalid.`,
          line: findLineNumber(content, `${jobName}:`),
          suggestion: 'A job must contain at least an environment executor and "steps".'
        });
        return;
      }

      const steps = [];
      if (Array.isArray(jobData.steps)) {
        jobData.steps.forEach((step, idx) => {
          let stepName = '';
          let command = '';
          if (typeof step === 'string') {
            stepName = step;
          } else if (typeof step === 'object') {
            const keys = Object.keys(step);
            if (keys.length > 0) {
              const mainKey = keys[0];
              const val = step[mainKey];
              if (mainKey === 'run') {
                stepName = 'run';
                if (typeof val === 'string') {
                  command = val;
                } else if (typeof val === 'object' && val !== null) {
                  command = val.command || '';
                  stepName = val.name || 'run';
                }
              } else {
                stepName = mainKey;
                if (typeof val === 'object' && val !== null) {
                  command = JSON.stringify(val);
                } else {
                  command = String(val);
                }
              }
            }
          }
          steps.push({ name: stepName, command, index: idx });
        });
      }

      // Check environment
      let environment = 'docker';
      let targetImage = '';
      if (jobData.executor) {
        environment = `executor:${jobData.executor}`;
      } else if (jobData.docker) {
        environment = 'docker';
        if (Array.isArray(jobData.docker) && jobData.docker.length > 0) {
          targetImage = typeof jobData.docker[0] === 'object' ? jobData.docker[0].image : String(jobData.docker[0]);
        }
      } else if (jobData.machine) {
        environment = 'machine';
      } else if (jobData.macos) {
        environment = 'macos';
      }

      const jobLine = findLineNumber(content, `${jobName}:`, findLineNumber(content, 'jobs:'));
      result.jobs.push({
        name: jobName,
        environment,
        image: targetImage,
        steps,
        line: jobLine
      });

      if (steps.length === 0) {
        result.errors.push({
          severity: 'warning',
          message: `Job "${jobName}" has no steps defined.`,
          line: jobLine,
          suggestion: 'Add "steps" to execute build commands.'
        });
      }
    });
  }

  // 5. Workflows
  if (doc.workflows && typeof doc.workflows === 'object') {
    const wfLineStart = findLineNumber(content, 'workflows:');
    // Version check inside workflows
    const workflowsData = Object.entries(doc.workflows).filter(([k]) => k !== 'version');
    
    workflowsData.forEach(([wfName, wfVal]) => {
      if (!wfVal || typeof wfVal !== 'object') return;
      const wfLine = findLineNumber(content, `${wfName}:`, wfLineStart);
      const jobsInWf = [];

      if (Array.isArray(wfVal.jobs)) {
        wfVal.jobs.forEach((jobItem) => {
          let name = '';
          const requires = [];
          if (typeof jobItem === 'string') {
            name = jobItem;
          } else if (typeof jobItem === 'object') {
            const keys = Object.keys(jobItem);
            if (keys.length > 0) {
              name = keys[0];
              const details = jobItem[name];
              if (details && Array.isArray(details.requires)) {
                requires.push(...details.requires);
              }
            }
          }
          if (name) {
            jobsInWf.push({ name, requires });
          }
        });
      }

      result.workflows.push({
        name: wfName,
        jobs: jobsInWf,
        line: wfLine
      });

      // Verify that all jobs defined in the workflow exist in jobs block
      jobsInWf.forEach((j) => {
        const exists = result.jobs.some((jobObj) => jobObj.name === j.name);
        if (!exists) {
          result.errors.push({
            severity: 'error',
            message: `Workflow "${wfName}" references undefined job "${j.name}".`,
            line: wfLine,
            suggestion: `Add the job definition for "${j.name}" under "jobs:" block.`
          });
        }
      });
    });
  }

  return result;
}
