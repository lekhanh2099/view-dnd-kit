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
  <div className="">
   {isActive ? (
    <div className="space-y-1 p-1 h-full">
     {group && isGroupDrag && (
      <div className="border-2 rounded-lg p-6 bg-gray-50 transition-all duration-300 ease-out">
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
       className={`border-2 rounded-lg p-6 space-y-2 bg-gray-50 transition-all duration-300 ease-out`}
      >
       <div className="flex items-center mb-4 justify-end">
        <p className="text-blue-500"> {group.groupId}</p>
        <div className="cursor-grab active:cursor-grabbing p-2 rounded transition-all duration-200 ease-out text-gray-400 hover:text-gray-600">
         <GripVertical size={18} />
        </div>
       </div>
       <div className="transition-all duration-300 ease-out">
        <div className="bg-white/90 border-2 border-green-400 rounded-lg p-4 transition-opacity duration-200 ease-out shadow-sm my-2">
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
       </div>
      </div>
     )}
    </div>
   ) : (
    <div ref={setNodeRef} className={"h-[10px]"}></div>
   )}
  </div>
 );
}
export function DraggableGroup({
 group,
 children,
 position,
 isLast,
}: {
 group: any;
 children: React.ReactNode;
 position: number;
 isLast?: boolean;
 isFirst?: boolean;
}) {
 const { groups, activeItem } = useViewsFilterStore();

 const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
  id: group.groupId,
  data: { type: DRAG_TYPES.GROUP, group },
 });

 const { setNodeRef: setDropRef } = useDroppable({
  id: group.groupId,
  data: { type: DRAG_TYPES.GROUP, group },
 });

 const lengthViewInGroup = useMemo(() => {
  return (
   groups.filter((g) => g.groupId === activeItem?.view?.groupId)[0]?.views
    ?.length || 0
  );
 }, [activeItem, groups]);

 const hideItem = useMemo(() => {
  return lengthViewInGroup === 1 && activeItem?.view?.groupId === group.groupId;
 }, [lengthViewInGroup, activeItem?.view?.groupId, group.groupId]);

 // Memoize the dragged group position to avoid recalculating (similar to view logic)
 const draggedGroupPosition = useMemo(() => {
  if (!activeItem?.group) return -1;
  return groups.findIndex((g) => g.groupId === activeItem.group.groupId);
 }, [activeItem?.group, groups]);

 // Enhanced logic for group drop zone visibility (following view pattern)
 const dropZoneVisibility = useMemo(() => {
  // If this group should be hidden (last view being dragged), hide all drop zones
  if (hideItem) {
   return { showTop: false, showBottom: false };
  }

  if (!activeItem?.group) {
   return { showTop: position === 0, showBottom: true };
  }

  const isDraggingGroup = draggedGroupPosition !== -1;
  if (!isDraggingGroup) {
   return { showTop: position === 0, showBottom: true };
  }

  // Calculate which drop zones should be visible (same logic as view)
  const showTop =
   position === 0 &&
   // Don't show top if this is the first group and we're dragging the first group
   !(draggedGroupPosition === 0) &&
   // Don't show top if this is right after the dragged group
   !(position === draggedGroupPosition + 1);

  const showBottom =
   // Don't show bottom if this is the dragged group itself
   !(position === draggedGroupPosition) &&
   // Don't show bottom if this is right before the dragged group
   !(position === draggedGroupPosition - 1) &&
   // Don't show bottom if this is the last group and we're dragging the last group
   !(isLast && draggedGroupPosition === groups.length - 1);

  return { showTop, showBottom };
 }, [
  activeItem,
  draggedGroupPosition,
  position,
  isLast,
  groups.length,
  hideItem,
 ]);

 const combinedRef = useCallback(
  (node) => {
   setNodeRef(node);
   setDropRef(node);
  },
  [setNodeRef, setDropRef]
 );

 const style = useMemo(
  () => ({
   opacity: isDragging || hideItem ? 0 : 1,
  }),
  [isDragging, hideItem]
 );

 const dragHandleProps = useMemo(
  () => ({
   ...attributes,
   ...listeners,
   style: { touchAction: "none" },
  }),
  [attributes, listeners]
 );

 return (
  <>
   {/* Top drop zone for groups */}
   {!isDragging && dropZoneVisibility.showTop && (
    <GroupDropZone position={position} />
   )}

   <div ref={combinedRef}>
    <div style={style} className="border-2 rounded-lg p-8 space-y-2 bg-gray-50">
     <div className="flex items-center mb-4 justify-end text-pink-400">
      {group.groupId}
      <div
       {...dragHandleProps}
       className="cursor-grab active:cursor-grabbing p-2 rounded transition-all duration-200 ease-out text-gray-400 hover:text-gray-600"
      >
       <GripVertical size={18} />
      </div>
     </div>
     <div>{children}</div>
    </div>
   </div>

   {/* Bottom drop zone for groups */}
   {!isDragging && dropZoneVisibility.showBottom && (
    <GroupDropZone position={position + 1} />
   )}
  </>
 );
}
