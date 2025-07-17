import { DRAG_TYPES, useViewsFilterStore } from "@/app/views-filter/context";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export function ViewDropZone({ groupId, position }) {
 const { setNodeRef } = useDroppable({
  id: `view-drop-${groupId}-${position}`,
  data: { type: "VIEW_DROP_ZONE", groupId, position },
 });

 const { overActiveId, activeItem } = useViewsFilterStore();

 const isActive = useMemo(() => {
  return `view-drop-${groupId}-${position}` === overActiveId;
 }, [groupId, position, overActiveId]);

 const flatItems = useMemo(() => {
  if (!activeItem || !isActive) return [];

  if (activeItem.type === DRAG_TYPES.VIEW) {
   return [activeItem.view];
  }

  if (activeItem.type === DRAG_TYPES.GROUP) {
   return activeItem.group?.views || [];
  }

  return [];
 }, [activeItem, isActive]);

 return (
  <div className="transition-all duration-300 ease-in-out">
   {isActive && flatItems.length > 0 ? (
    <div className="space-y-1 p-1 h-full">
     {flatItems.map((item, index) => (
      <div
       key={`${item.id}-${index}`}
       className="bg-white/90 border-2 border-green-400 rounded-lg p-4 transition-opacity duration-200 ease-out shadow-sm"
       style={{ animation: "fadeSlideIn 200ms ease-out" }}
      >
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
         <div className="w-3 h-3 rounded-sm flex-shrink-0 bg-green-500"></div>
         <p className="font-medium text-sm text-green-800">
          {item.columnId || "Unknown Column"}
         </p>
        </div>
        <div className="text-xs text-green-600 opacity-75">Preview</div>
       </div>
      </div>
     ))}
    </div>
   ) : (
    <div ref={setNodeRef} className="py-1 bg-green-500">
     {/* {`view-drop-${groupId}-${position}`} */}
    </div>
   )}
  </div>
 );
}
export function DraggableView({
 view,
 groupId,
 position,
}: {
 view: any;
 groupId: string;
 position: number;
 isLast: boolean;
 isFirst: boolean;
}) {
 const { groups, setActiveViewId } = useViewsFilterStore();

 const { attributes, listeners, setNodeRef, transform, isDragging } =
  useDraggable({
   id: view.id,
   data: { type: DRAG_TYPES.VIEW, view },
  });

 const { setNodeRef: setDropRef } = useDroppable({
  id: view.id,
  data: { type: DRAG_TYPES.VIEW, view },
 });

 const style = useMemo(
  () => ({
   opacity: isDragging ? 0.5 : 1,
  }),
  [transform, isDragging]
 );

 return (
  <>
   {!isDragging && position === 0 && (
    <ViewDropZone groupId={groupId} position={position} />
   )}
   <div
    ref={(node) => {
     setNodeRef(node);
     setDropRef(node);
    }}
   >
    {!isDragging && (
     <div
      style={style}
      className={`bg-white border-2 rounded-lg p-4 transition-all duration-300 ease-out h-auto`}
     >
      <div className="flex items-center justify-between gap-2">
       <div className="flex items-center gap-2">
        {view.id}
        <p className={`font-medium text-sm text-green-500`}>{view.columnId}</p>
       </div>
       <div
        {...attributes}
        {...listeners}
        style={{ touchAction: "none" }}
        className="cursor-grab active:cursor-grabbing p-2 rounded transition-all duration-200 ease-out text-gray-400 hover:text-gray-600"
       >
        <GripVertical size={16} />
       </div>
      </div>
     </div>
    )}
   </div>

   {!isDragging && <ViewDropZone groupId={groupId} position={position + 1} />}
  </>
 );
}
