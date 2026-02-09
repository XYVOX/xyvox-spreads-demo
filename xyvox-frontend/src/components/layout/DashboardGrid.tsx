import { useEffect, useRef } from 'react';
import 'gridstack/dist/gridstack.min.css';
import { GridStack, type GridStackWidget } from 'gridstack';
import { WidgetFrame } from './WidgetFrame';
import { useMarketStore } from '../../store/marketStore';
import { OpportunityTable } from '../dashboard/OpportunityTable';

const DEFAULT_WIDGETS: GridStackWidget[] = [
    { id: 'spotSpot', x: 0, y: 0, w: 6, h: 6 },
    { id: 'spotPerp', x: 6, y: 0, w: 6, h: 6 },
    { id: 'perpPerp', x: 0, y: 6, w: 6, h: 6 },
    { id: 'funding',  x: 6, y: 6, w: 6, h: 6 },
];

export const DashboardGrid = () => {
    const { data, setPaused } = useMarketStore();
    const gridRef = useRef<GridStack | null>(null);

    useEffect(() => {
        if (gridRef.current) return;

        const savedLayout = localStorage.getItem('xyvox:layout-gs-v1');
        const initialWidgets = savedLayout ? JSON.parse(savedLayout) : DEFAULT_WIDGETS;

        const grid = GridStack.init({
            column: 12,
            cellHeight: 70,
            margin: 8,
            float: true,
            disableOneColumnMode: true,
            animate: true,
            handle: '.drag-handle',
        } as any);

        gridRef.current = grid;
        grid.load(initialWidgets);

        grid.on('dragstart', () => {
            setPaused(true);
        });

        grid.on('dragstop', () => {
            setPaused(false);

            const currentLayout = grid.save(false) as GridStackWidget[];
            localStorage.setItem('xyvox:layout-gs-v1', JSON.stringify(currentLayout));
        });

        grid.on('change', () => {
            const currentLayout = grid.save(false) as GridStackWidget[];
            localStorage.setItem('xyvox:layout-gs-v1', JSON.stringify(currentLayout));
        });

        return () => {
        };
    }, [setPaused]);

    return (
        <div className="grid-stack h-full w-full">

            {/* SPOT-SPOT */}
            <div className="grid-stack-item" gs-id="spotSpot">
                <div className="grid-stack-item-content h-full w-full">
                    <WidgetFrame title="Inter-Exchange (Spot)" headerColor="text-emerald-400">
                        <OpportunityTable data={data.spotSpot} type="spot" />
                    </WidgetFrame>
                </div>
            </div>

            {/* SPOT-PERP */}
            <div className="grid-stack-item" gs-id="spotPerp">
                <div className="grid-stack-item-content h-full w-full">
                    <WidgetFrame title="Basis Arbitrage (Spot-Perp)" headerColor="text-indigo-400">
                        <OpportunityTable data={data.spotPerp} type="spot" />
                    </WidgetFrame>
                </div>
            </div>

            {/* PERP-PERP */}
            <div className="grid-stack-item" gs-id="perpPerp">
                <div className="grid-stack-item-content h-full w-full">
                    <WidgetFrame title="Cross-Exchange Scalp (Perp)" headerColor="text-blue-400">
                        <OpportunityTable data={data.perpPerp} type="perp" />
                    </WidgetFrame>
                </div>
            </div>

            {/* FUNDING */}
            <div className="grid-stack-item" gs-id="funding">
                <div className="grid-stack-item-content h-full w-full">
                    <WidgetFrame title="Funding Rates" headerColor="text-amber-400">
                        <OpportunityTable data={data.funding} type="funding" />
                    </WidgetFrame>
                </div>
            </div>
        </div>
    );
};