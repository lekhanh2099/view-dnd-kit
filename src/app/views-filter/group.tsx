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
        <div className="cursor-grab active:cursor-grabbing p-2 rounded  text-gray-400 hover:text-gray-600">
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
           <div className="text-xs text-green-600 opacity-75">Preview</div>
          </div>
         </div>
        ))}
       </div>
      </div>
     )}
     {view && isViewDrag && (
      <div className="border-2 rounded-lg p-2 space-y-2 bg-gray-50">
       <div className="flex items-center mb-4 justify-end">
        <p className="text-blue-500"> {group.groupId}</p>
        <div className="cursor-grab active:cursor-grabbing p-2 rounded  text-gray-400 hover:text-gray-600">
         <GripVertical size={18} />
        </div>
       </div>
       <div className="flex items-center justify-between gap-2 bg-white border-2 rounded-lg p-2">
        <div className="flex items-center gap-2">
         <p className="text-blue-500">{view.id}</p>
         <p className="font-medium text-sm text-green-500">{view.columnId}</p>
        </div>
       </div>
      </div>
     )}
    </div>
   ) : (
    <div ref={setNodeRef} className={"p-1"}></div>
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

 const draggedGroupPosition = useMemo(() => {
  if (!activeItem?.group) return -1;
  return groups.findIndex((g) => g.groupId === activeItem.group.groupId);
 }, [activeItem?.group, groups]);

 const dropZoneVisibility = useMemo(() => {
  if (!activeItem?.group) {
   return { showTop: position === 0, showBottom: true };
  }

  const isDraggingGroup = draggedGroupPosition !== -1;
  if (!isDraggingGroup) {
   return { showTop: position === 0, showBottom: true };
  }

  const showTop =
   position === 0 &&
   !(draggedGroupPosition === 0) &&
   !(position === draggedGroupPosition + 1);

  const showBottom =
   !(position === draggedGroupPosition) &&
   !(position === draggedGroupPosition - 1) &&
   !(isLast && draggedGroupPosition === groups.length - 1);

  return { showTop, showBottom };
 }, [activeItem, draggedGroupPosition, position, isLast, groups.length]);

 const combinedRef = useCallback(
  (node) => {
   setNodeRef(node);
   setDropRef(node);
  },
  [setNodeRef, setDropRef]
 );

 const style = useMemo(
  () => ({
   opacity: isDragging ? 0 : 1,
   marginBottom: isDragging ? 8 : 0,
   marginTop: isDragging ? 8 : 0,
   zIndex: isDragging ? 10000 : 0,
  }),
  [isDragging]
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
   {!isDragging && dropZoneVisibility.showTop && (
    <GroupDropZone position={position} />
   )}

   <div ref={combinedRef}>
    <div
     style={style}
     className="border-2 rounded-lg px-2 space-y-2 bg-gray-50 relative"
    >
     <div className="flex items-center justify-end text-pink-400">
      {group.groupId}
      <div
       {...dragHandleProps}
       className="cursor-grab active:cursor-grabbing p-2 rounded  text-gray-400 hover:text-gray-600"
      >
       <GripVertical size={18} />
      </div>
     </div>
     <div>{children}</div>
    </div>
   </div>

   {!isDragging && dropZoneVisibility.showBottom && (
    <GroupDropZone position={position + 1} />
   )}
  </>
 );
}
