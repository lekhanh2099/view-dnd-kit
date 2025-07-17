"use client";

import { DRAG_TYPES, useViewsFilterStore } from "@/app/views-filter/context";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import React, { useCallback, useMemo } from "react";

export function GroupDropZone({ position }: { position: number }) {
 const { activeItem, overActiveId } = useViewsFilterStore();
 const { setNodeRef } = useDroppable({
  id: `group-drop-${position}`,
  data: { type: "GROUP_DROP_ZONE", position },
 });

 const isActive = useMemo(() => {
  return `group-drop-${position}` === overActiveId;
 }, [position, overActiveId]);

 const isGroupDrag = activeItem?.type === DRAG_TYPES.GROUP;
 const isViewDrag = activeItem?.type === DRAG_TYPES.VIEW;

 const view = useMemo(() => {
  return isViewDrag ? activeItem?.view : [];
 }, [activeItem]);
 const group = useMemo(() => {
  return isGroupDrag ? activeItem?.group : {};
 }, [activeItem]);

 return (
  <div className="transition-all duration-300 ease-in-out">
   {isActive ? (
    <div className="space-y-1 p-1 h-full">
     {group && isGroupDrag && (
      <div
       className="border-2 rounded-lg p-6 bg-gray-50 transition-all duration-300 ease-out"
       style={{ animation: "fadeSlideIn 200ms ease-out" }}
      >
       <div className="flex items-center mb-4 justify-end">
        <div className="cursor-grab active:cursor-grabbing p-2 rounded transition-all duration-200 ease-out text-gray-400 hover:text-gray-600">
         <GripVertical size={18} />
        </div>
       </div>
       <div className="space-y-2">
        {group?.views?.map((view, index) => (
         <div
          key={`${view.id}-${index}`}
          className="bg-white/90 border-2 border-green-400 rounded-lg p-4 transition-opacity duration-200 ease-out shadow-sm"
         >
          <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm flex-shrink-0 bg-green-500"></div>
            <p className="font-medium text-sm text-green-800">
             {view.columnId || "Unknown Column"}
            </p>
           </div>
           <div className="text-xs text-green-600 opacity-75">Preview</div>
          </div>
         </div>
        ))}
       </div>
      </div>
     )}
     {view && isViewDrag && (
      <div
       className="bg-white/90 border-2 border-green-400 rounded-lg p-4 transition-opacity duration-200 ease-out shadow-sm my-2"
       style={{ animation: "fadeSlideIn 200ms ease-out" }}
      >
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
         <div className="w-3 h-3 rounded-sm flex-shrink-0 bg-green-500"></div>
         <p className="font-medium text-sm text-green-800">
          {view.columnId || "Unknown Column"}
         </p>
        </div>
        <div className="text-xs text-green-600 opacity-75">Preview</div>
       </div>
      </div>
     )}
    </div>
   ) : (
    <div ref={setNodeRef} className={"py-1 bg-red-400"}>
     {/* {`group-drop-${position}`} */}
    </div>
   )}
  </div>
 );
}

export function DraggableGroup({
 group,
 children,
 position,
}: {
 group: any;
 children: React.ReactNode;
 position: number;
}) {
 const { overActiveId } = useViewsFilterStore();

 const { attributes, listeners, setNodeRef, transform, isDragging } =
  useDraggable({
   id: group.groupId,
   data: { type: DRAG_TYPES.GROUP, group },
  });

 const { setNodeRef: setDropRef } = useDroppable({
  id: group.groupId,
  data: { type: DRAG_TYPES.GROUP, group },
 });

 const style = useMemo(
  () => ({
   opacity: isDragging ? 0.3 : 1,
   zIndex: isDragging ? 1000 : 1,
  }),
  [transform, isDragging]
 );

 return (
  <>
   {!isDragging && position === 0 && <GroupDropZone position={position} />}
   <div
    ref={(node) => {
     setNodeRef(node);
     setDropRef(node);
    }}
   >
    {!isDragging && (
     <div
      className={`border-2 rounded-lg p-6 space-y-2 bg-gray-50 transition-all duration-300 ease-out`}
      style={style}
     >
      <div className="flex items-center mb-4 justify-end">
       {group.groupId}
       <div
        {...attributes}
        {...listeners}
        style={{ touchAction: "none" }}
        className="cursor-grab active:cursor-grabbing p-2 rounded transition-all duration-200 ease-out text-gray-400 hover:text-gray-600"
       >
        <GripVertical size={18} />
       </div>
      </div>
      <div className="transition-all duration-300 ease-out">{children}</div>
     </div>
    )}
   </div>
   {!isDragging && <GroupDropZone position={position + 1} />}
  </>
 );
}
