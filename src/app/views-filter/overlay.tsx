import {
 convertToAppFormat,
 DRAG_TYPES,
 useViewsFilterStore,
} from "@/app/views-filter/context";
import { DragOverlay } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { GripVertical } from "lucide-react";

// Drag overlay components
export const ViewDragOverlay = ({ view }) => {
 return (
  <div className="bg-white border-2 rounded-lg p-4 transition-all duration-300 ease-out h-auto">
   <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
     <div className={`w-3 h-3 rounded-sm flex-shrink-0`}></div>
     <p className={`font-medium text-sm text-green-500`}>{view.columnId}</p>
    </div>
    <div
     style={{ touchAction: "none" }}
     className="cursor-grab active:cursor-grabbing p-2 rounded transition-all duration-200 ease-out text-gray-400 hover:text-gray-600"
    >
     <GripVertical size={16} />
    </div>
   </div>
  </div>
 );
};

export const GroupDragOverlay = ({ group }) => (
 <div className="border-2 border-purple-400 rounded-lg p-6 bg-purple-50 shadow-2xl transform opacity-20">
  <div className="space-y-2">
   {group.views.map((view) => (
    <div
     key={view.id}
     className="bg-white border border-purple-200 rounded p-2"
    >
     <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-sm bg-purple-400"></div>
      <p className="text-xs text-purple-700">{view.columnId}</p>
     </div>
    </div>
   ))}
  </div>
 </div>
);

export function ViewFilterOverlay() {
 const { activeItem } = useViewsFilterStore();

 return (
  <div className="relative">
   <DragOverlay modifiers={[restrictToWindowEdges]}>
    {activeItem?.type === DRAG_TYPES.VIEW && (
     <ViewDragOverlay view={activeItem?.view} />
    )}
    {activeItem?.type === DRAG_TYPES.GROUP && (
     <GroupDragOverlay group={activeItem?.group} />
    )}
   </DragOverlay>
  </div>
 );
}
