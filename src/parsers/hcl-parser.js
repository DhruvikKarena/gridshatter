import { findLineNumber } from './parser-utils.js';

/**
 * Parses Terraform HCL (.tf) content.
 * @param {string} content - Raw HCL string.
 * @returns {object} Normalized HCL AST.
 */
export function parseHCL(content) {
  const result = {
    type: 'terraform',
    provider: { name: 'aws', region: 'us-east-1' }, // Defaults
    resources: [],
    variables: [],
    modules: [],
    dataSources: [],
    errors: []
  };

  if (!content || !content.trim()) {
    result.errors.push({
      severity: 'error',
      message: 'File content is empty.',
      line: 1,
      suggestion: 'Please paste or upload a valid Terraform .tf file.'
    });
    return result;
  }

  // Preprocess: remove comments to avoid parsing interference, but keep line count intact
  const lines = content.split('\n');
  const processedLines = lines.map(line => {
    // Keep line length and layout but strip content of single-line comments
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
      return '';
    }
    // Remove inline comments
    let inString = false;
    let cleanLine = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inString = !inString;
      }
      if (!inString && ((char === '#' && line[i - 1] !== '{') || (char === '/' && line[i + 1] === '/'))) {
        break;
      }
      cleanLine += char;
    }
    return cleanLine;
  });

  const fullCleanedContent = processedLines.join('\n');
  
  // Custom lexer / parser state machine to find blocks
  let index = 0;
  const length = fullCleanedContent.length;

  function skipWhitespace() {
    while (index < length && /\s/.test(fullCleanedContent[index])) {
      index++;
    }
  }

  // Find line number in original content from current index in cleaned content
  function getLineNumber(idx) {
    const textBefore = fullCleanedContent.substring(0, idx);
    return textBefore.split('\n').length;
  }

  // Extract a block body (counting matching curly braces)
  function extractBlockBody() {
    let braceCount = 0;
    let inString = false;
    const startIndex = index;

    while (index < length) {
      const char = fullCleanedContent[index];
      
      if (char === '"' && fullCleanedContent[index - 1] !== '\\') {
        inString = !inString;
      }

      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            const body = fullCleanedContent.substring(startIndex + 1, index);
            index++; // Consume '}'
            return body;
          }
        }
      }
      index++;
    }
    return null;
  }

  // Parse simple key-value attributes inside a block body
  function parseAttributes(body) {
    const attributes = {};
    const bodyLines = body.split('\n');
    
    bodyLines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      // Match key = value (handling simple assignments, ignoring nested blocks for now)
      const match = trimmed.match(/^([a-zA-Z0-9_\-]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        // Remove enclosing quotes or array brackets if simple string/list
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        attributes[key] = val;
      }
    });

    return attributes;
  }

  // Main Parsing Loop
  try {
    while (index < length) {
      skipWhitespace();
      if (index >= length) break;

      // Look for blocks: resource, provider, variable, data, module, locals
      const remaining = fullCleanedContent.substring(index);
      
      // 1. Resource: resource "type" "name" {
      const resourceMatch = remaining.match(/^(resource)\s+"([^"]+)"\s+"([^"]+)"\s*\{/);
      if (resourceMatch) {
        const line = getLineNumber(index);
        const type = resourceMatch[2];
        const name = resourceMatch[3];
        index += resourceMatch[0].length - 1; // Stop at '{'
        
        const body = extractBlockBody();
        if (body === null) {
          result.errors.push({
            severity: 'error',
            message: `Resource "${type}.${name}" block is unclosed (missing closing brace).`,
            line,
            suggestion: 'Ensure all curly braces are properly closed.'
          });
          break;
        }

        const attributes = parseAttributes(body);
        result.resources.push({
          type,
          name,
          attributes,
          line,
          rawBody: body
        });
        continue;
      }

      // 2. Provider: provider "name" {
      const providerMatch = remaining.match(/^(provider)\s+"([^"]+)"\s*\{/);
      if (providerMatch) {
        const line = getLineNumber(index);
        const name = providerMatch[2];
        index += providerMatch[0].length - 1;

        const body = extractBlockBody();
        if (body === null) {
          result.errors.push({
            severity: 'error',
            message: `Provider "${name}" block is unclosed.`,
            line,
            suggestion: 'Verify closing curly brace.'
          });
          break;
        }

        const attributes = parseAttributes(body);
        if (name === 'aws') {
          result.provider = {
            name: 'aws',
            region: attributes.region || 'us-east-1'
          };
        }
        continue;
      }

      // 3. Data: data "type" "name" {
      const dataMatch = remaining.match(/^(data)\s+"([^"]+)"\s+"([^"]+)"\s*\{/);
      if (dataMatch) {
        const line = getLineNumber(index);
        const type = dataMatch[2];
        const name = dataMatch[3];
        index += dataMatch[0].length - 1;

        const body = extractBlockBody();
        if (body === null) {
          result.errors.push({
            severity: 'error',
            message: `Data source "${type}.${name}" block is unclosed.`,
            line,
            suggestion: 'Verify closing curly brace.'
          });
          break;
        }

        const attributes = parseAttributes(body);
        result.dataSources.push({
          type,
          name,
          attributes,
          line
        });
        continue;
      }

      // 4. Variable: variable "name" {
      const variableMatch = remaining.match(/^(variable)\s+"([^"]+)"\s*\{/);
      if (variableMatch) {
        const line = getLineNumber(index);
        const name = variableMatch[2];
        index += variableMatch[0].length - 1;

        const body = extractBlockBody();
        if (body === null) {
          result.errors.push({
            severity: 'error',
            message: `Variable "${name}" block is unclosed.`,
            line,
            suggestion: 'Verify closing curly brace.'
          });
          break;
        }

        const attributes = parseAttributes(body);
        result.variables.push({
          name,
          default: attributes.default || '',
          type: attributes.type || 'string',
          line
        });
        continue;
      }

      // 5. Module: module "name" {
      const moduleMatch = remaining.match(/^(module)\s+"([^"]+)"\s*\{/);
      if (moduleMatch) {
        const line = getLineNumber(index);
        const name = moduleMatch[2];
        index += moduleMatch[0].length - 1;

        const body = extractBlockBody();
        if (body === null) {
          result.errors.push({
            severity: 'error',
            message: `Module "${name}" block is unclosed.`,
            line,
            suggestion: 'Verify closing curly brace.'
          });
          break;
        }

        const attributes = parseAttributes(body);
        result.modules.push({
          name,
          source: attributes.source || '',
          attributes,
          line
        });
        continue;
      }

      // 6. Locals: locals {
      const localsMatch = remaining.match(/^(locals)\s*\{/);
      if (localsMatch) {
        const line = getLineNumber(index);
        index += localsMatch[0].length - 1;

        const body = extractBlockBody();
        if (body === null) {
          result.errors.push({
            severity: 'error',
            message: 'Locals block is unclosed.',
            line,
            suggestion: 'Verify closing curly brace.'
          });
          break;
        }
        // Local variables can be parsed as general variables/attributes
        const attrs = parseAttributes(body);
        Object.entries(attrs).forEach(([key, val]) => {
          result.variables.push({
            name: `local.${key}`,
            default: val,
            type: 'local',
            line
          });
        });
        continue;
      }

      // If we match none of these, consume character and move forward
      index++;
    }
  } catch (err) {
    result.errors.push({
      severity: 'error',
      message: `HCL parsing error: ${err.message}`,
      line: 1,
      suggestion: 'Please verify that the syntax conforms to HashiCorp HCL format.'
    });
  }

  // 7. Post-parsing Validation
  // Validate VPC and resources references
  result.resources.forEach(res => {
    // If a resource points to another resource that does not exist in the code, or similar validations
    // e.g. check if a reference format exists
    Object.entries(res.attributes).forEach(([key, val]) => {
      // Find matches like aws_vpc.main.id
      const refMatches = val.match(/aws_[a-zA-Z0-9_]+\.[a-zA-Z0-9_\-]+/g);
      if (refMatches) {
        refMatches.forEach(ref => {
          const parts = ref.split('.');
          const refType = parts[0];
          const refName = parts[1];

          // Check if this referenced resource exists in resources or data sources
          const exists = result.resources.some(r => r.type === refType && r.name === refName) ||
                         result.dataSources.some(d => d.type === refType && d.name === refName);
                         
          if (!exists) {
            // Check if it's a variable reference var.name or local.name
            // Skip variables since they are dynamic
            result.errors.push({
              severity: 'warning',
              message: `Resource "${res.type}.${res.name}" references undefined resource/data "${ref}".`,
              line: res.line,
              suggestion: `Verify that "${ref}" is defined in this file or imported via data sources.`
            });
          }
        });
      }
    });
  });

  return result;
}
