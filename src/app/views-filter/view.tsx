import { DRAG_TYPES, useViewsFilterStore } from "@/app/views-filter/context";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { useCallback, useMemo, useRef } from "react";

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
  <div className="">
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
    <div ref={setNodeRef} className="h-[10px]">
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
 isLast,
 viewsInGroup,
}: {
 view: any;
 groupId: string;
 position: number;
 isLast: boolean;
 isFirst: boolean;
 viewsInGroup: any[];
}) {
 const { activeItem } = useViewsFilterStore();

 const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
  id: view.id,
  data: { type: DRAG_TYPES.VIEW, view },
 });

 const { setNodeRef: setDropRef } = useDroppable({
  id: view.id,
  data: { type: DRAG_TYPES.VIEW, view },
 });

 // Memoize the dragged item position to avoid recalculating
 const draggedItemPosition = useMemo(() => {
  if (!activeItem?.view) return -1;
  return viewsInGroup.findIndex((item) => item.id === activeItem.view.id);
 }, [activeItem?.view, viewsInGroup]);

 // Enhanced logic for drop zone visibility
 const dropZoneVisibility = useMemo(() => {
  if (!activeItem?.view) {
   return { showTop: position === 0, showBottom: true };
  }

  const isDraggingInThisGroup = draggedItemPosition !== -1;
  if (!isDraggingInThisGroup) {
   return { showTop: position === 0, showBottom: true };
  }

  // Calculate which drop zones should be visible
  const showTop =
   position === 0 &&
   // Don't show top if this is the first item and we're dragging the first item
   !(draggedItemPosition === 0) &&
   // Don't show top if this is right after the dragged item
   !(position === draggedItemPosition + 1);

  const showBottom =
   // Don't show bottom if this is the dragged item itself
   !(position === draggedItemPosition) &&
   // Don't show bottom if this is right before the dragged item
   !(position === draggedItemPosition - 1) &&
   // Don't show bottom if this is the last item and we're dragging the last item
   !(isLast && draggedItemPosition === viewsInGroup.length - 1);

  return { showTop, showBottom };
 }, [activeItem, draggedItemPosition, position, isLast, viewsInGroup.length]);

 // Memoize the combined ref callback to avoid unnecessary re-renders
 const combinedRef = useCallback(
  (node) => {
   setNodeRef(node);
   setDropRef(node);
  },
  [setNodeRef, setDropRef]
 );

 const style = useMemo(
  () => ({
   opacity: isDragging ? 0.4 : 1,
  }),
  [isDragging]
 );

 // Memoize drag handle props to avoid object recreation
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
   {/* Top drop zone */}
   {!isDragging && dropZoneVisibility.showTop && (
    <ViewDropZone groupId={groupId} position={position} />
   )}

   <div ref={combinedRef}>
    <div style={style} className="bg-white border-2 rounded-lg p-4">
     <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
       <p className="text-blue-500">{view.id}</p>
       <p className="font-medium text-sm text-green-500">{view.columnId}</p>
      </div>
      <div
       {...dragHandleProps}
       className="cursor-grab active:cursor-grabbing p-2 rounded transition-all duration-200 ease-out text-gray-400 hover:text-gray-600"
      >
       <GripVertical size={16} />
      </div>
     </div>
    </div>
   </div>

   {/* Bottom drop zone */}
   {!isDragging && dropZoneVisibility.showBottom && (
    <ViewDropZone groupId={groupId} position={position + 1} />
   )}
  </>
 );
}
