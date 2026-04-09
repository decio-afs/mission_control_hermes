import { ReactFlow, Controls, Background, type Node, type Edge, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play } from 'lucide-react';
import { useEffect, useState } from 'react';

const initialNodes: Node[] = [
  { id: '1', position: { x: 50, y: 150 }, data: { label: 'TrendCollector\n(Aggregator)' }, type: 'input' },
  { id: '2', position: { x: 250, y: 150 }, data: { label: 'ViabilityScorer\n(>60 Gate)' } },
  { id: '3', position: { x: 450, y: 150 }, data: { label: 'ContentGenerator\n(Multi-modal)' } },
  { id: '4', position: { x: 650, y: 150 }, data: { label: 'ReviewGate\n(Human/AI)' } },
  { id: '5', position: { x: 850, y: 150 }, data: { label: 'Publisher\n(Queue)' }, type: 'output' },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#38bdf8' } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#a78bfa' } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#34d399' } },
  { id: 'e4-5', source: '4', target: '5', animated: true, style: { stroke: '#f59e0b' } },
];

export default function WorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        // align vertically for mobile
        setNodes(nds => nds.map((n, i) => ({
          ...n,
          position: { x: window.innerWidth / 2 - 75, y: 50 + i * 100 }
        })));
      } else {
        // horizontal for desktop
        setNodes(nds => nds.map((n, i) => ({
          ...n,
          position: { x: 50 + i * 200, y: 150 }
        })));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="p-4 md:p-6 h-full flex flex-col min-w-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-1">Workflow Builder</h2>
          <div className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
            Visual Node Editor
          </div>
        </div>
        <button className="w-full md:w-auto rounded-full bg-gradient-to-r from-[#f64e6e] to-[#ff795e] text-white px-6 py-2.5 font-bold uppercase text-xs tracking-wider hover:shadow-[0_0_20px_-5px_#f64e6e] transition flex justify-center items-center gap-2">
          <Play className="w-4 h-4 fill-white" /> Compile Pipeline
        </button>
      </div>

      <div className="flex-1 bg-bg-card rounded-2xl md:rounded-3xl border border-border-subtle overflow-hidden relative min-h-[400px]">
        <style dangerouslySetInnerHTML={{__html: `
          .react-flow__node { background: #050505; color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; padding: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5); text-align: center; white-space: pre-wrap; width: 150px; }
          .react-flow__node.selected { border-color: #f64e6e; box-shadow: 0 0 15px -3px rgba(246, 78, 110, 0.4); }
          .react-flow__controls button { background: #0a0a0a; border-bottom: 1px solid rgba(255,255,255,0.1); color: #b8b8b8; }
          .react-flow__controls button:hover { background: #1a1a1a; color: #fff; }
          .react-flow__handle { background: #f64e6e; border: none; width: 8px; height: 8px; }
        `}} />
        <ReactFlow 
          nodes={nodes} 
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView={!isMobile} // Disable auto fitView on mobile to let vertical layout breathe
          defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        >
          <Background color="rgba(255,255,255,0.05)" gap={24} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
