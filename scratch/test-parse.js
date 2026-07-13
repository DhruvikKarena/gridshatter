import { readFileSync } from 'fs';
import { parseHCL } from '../src/parsers/hcl-parser.js';
import { mapTerraformToGraph } from '../src/mappers/terraform-mapper.js';
import { computeTerraformLayout } from '../src/visualization/layout-engine.js';

try {
  const content = readFileSync('../demo.tf', 'utf8');
  console.log('--- RAW HCL ---');
  const ast = parseHCL(content);
  console.log('--- AST ERRORS ---', ast.errors);
  console.log('--- AST PROVIDER ---', ast.provider);
  console.log('--- AST RESOURCES ---', ast.resources.map(r => ({ type: r.type, name: r.name, parentId: r.attributes.subnet_id })));
  
  const graph = mapTerraformToGraph(ast);
  console.log('--- MAPPED GRAPH NODES ---', graph.nodes.map(n => ({ id: n.id, parent: n.parent, category: n.category })));
  
  const layout = computeTerraformLayout(graph);
  console.log('--- LAYOUT NODES WITH COORDS ---', layout.nodes.map(n => ({ id: n.id, x: n.x, y: n.y, parent: n.parent })));
} catch (e) {
  console.error(e);
}
