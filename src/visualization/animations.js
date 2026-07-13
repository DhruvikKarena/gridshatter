import { renderNode, renderBoundaryGroup } from './node-renderer.js';
import { renderEdge } from './edge-renderer.js';

/**
 * Animates the generation of the cloud architecture diagram step-by-step.
 * @param {DiagramEngine} engine - Instance of the DiagramEngine.
 * @param {object} graph - Graph data containing nodes, edges, groups.
 * @param {ProcessTerminal} terminal - Terminal component for logging.
 * @param {'slow' | 'normal' | 'fast'} speed - Speed of generation.
 * @param {function} onComplete - Callback when animation completes.
 * @returns {object} Control object with cancel() method.
 */
export function animateGeneration(engine, graph, terminal, speed = 'normal', onComplete) {
  let isCancelled = false;
  let currentTimeout = null;

  // Speed timings in ms
  const timings = {
    slow: { step: 800, node: 400, edge: 300 },
    normal: { step: 400, node: 200, edge: 150 },
    fast: { step: 150, node: 50, edge: 40 }
  };

  const delay = timings[speed] || timings.normal;
  const scene = engine.scene;
  
  // Clear scene and save graph structure to engine for tooltip logic
  scene.innerHTML = '';
  engine.nodes = graph.nodes;
  engine.edges = graph.edges;

  const wait = (ms) => new Promise(resolve => {
    if (isCancelled) return;
    currentTimeout = setTimeout(resolve, ms);
  });

  async function run() {
    if (isCancelled) return;

    // Step 1: Initialize
    terminal.log('info', 'Initializing canvas workspace...');
    await wait(delay.step);

    // Step 2: Render Boundary Groups
    if (graph.groups && graph.groups.length > 0) {
      terminal.log('step', `Creating boundaries for ${graph.groups.length} networks/groups...`);
      for (const group of graph.groups) {
        if (isCancelled) return;
        scene.innerHTML += renderBoundaryGroup(group);
        terminal.log('info', `  + Group container: ${group.label}`);
        await wait(delay.node / 2);
      }
    }
    await wait(delay.step);

    // Step 3: Render Nodes one-by-one
    if (graph.nodes && graph.nodes.length > 0) {
      terminal.log('step', `Provisioning ${graph.nodes.length} cloud resource nodes...`);
      for (const node of graph.nodes) {
        if (isCancelled) return;
        scene.innerHTML += renderNode(node);
        terminal.log('info', `  [OK] Created node: ${node.name} (${node.sublabel})`);
        
        // Auto-center viewport loosely around nodes during generation
        engine.zoomToFit();
        
        await wait(delay.node);
      }
    }
    await wait(delay.step);

    // Step 4: Render Edges one-by-one
    if (graph.edges && graph.edges.length > 0) {
      terminal.log('step', `Establishing ${graph.edges.length} network connection links...`);
      for (const edge of graph.edges) {
        if (isCancelled) return;
        const source = graph.nodes.find(n => n.id === edge.source);
        const target = graph.nodes.find(n => n.id === edge.target);
        if (source && target) {
          scene.innerHTML += renderEdge(edge, source, target);
          const edgeDesc = edge.label ? ` via '${edge.label}'` : '';
          terminal.log('info', `  Linked: ${source.name} ➔ ${target.name}${edgeDesc}`);
        }
        await wait(delay.edge);
      }
    }
    await wait(delay.step);

    // Done
    terminal.log('success', '✓ Architecture simulation successfully completed!');
    engine.zoomToFit();
    
    if (onComplete) onComplete();
  }

  run();

  return {
    cancel() {
      isCancelled = true;
      if (currentTimeout) clearTimeout(currentTimeout);
      // Immediately draw full diagram on cancel
      engine.draw(graph);
    }
  };
}
