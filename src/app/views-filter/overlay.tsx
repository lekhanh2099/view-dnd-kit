import {
 convertToAppFormat,
 DRAG_TYPES,
 useViewsFilterStore,
} from "@/app/views-filter/context";
import { DragOverlay } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { GripVertical } from "lucide-react";

export const ViewDragOverlay = ({ view }) => {
 return (
  <div className="flex items-center justify-between gap-2 bg-white border-2 rounded-lg p-2 relative">
   <div className="flex items-center gap-2">
    <div className="w-3 h-3 rounded-sm flex-shrink-0 bg-green-500"></div>
    <p className="text-blue-500">{view.id}</p>
    <p className="font-medium text-sm text-green-800">
     {view.columnId || "Unknown Column"}
    </p>
   </div>
   <div className="cursor-grabbing p-2 rounded text-gray-400 hover:text-gray-600">
    <GripVertical size={16} />
   </div>
  </div>
 );
};

export const GroupDragOverlay = ({ group }) => {
 return (
  <div className="border-2 rounded-lg p-6 bg-gray-50 transition-all duration-300 ease-out">
   <div className="flex items-center mb-4 justify-end">
    <div className="cursor-grabbing rounded text-gray-400 hover:text-gray-600">
     <GripVertical size={18} />
    </div>
   </div>
   <div className="space-y-2">
    {group?.views?.map((view, index) => (
     <div
      key={`${view.id}-${index}`}
      className="bg-white/90 border-2 border-green-400 rounded-lg p-2 transition-opacity duration-200 ease-out shadow-sm"
     >
      <div className="flex items-center justify-between">
       <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-sm flex-shrink-0 bg-green-500"></div>
        <p className="font-medium text-sm text-green-800">
         {view.columnId || "Unknown Column"}
        </p>
       </div>
      </div>
     </div>
    ))}
   </div>
  </div>
 );
};

export function ViewFilterOverlay() {
 const { activeItem } = useViewsFilterStore();

 return (
  <div className="relative z-[9999999]">
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
