import { DRAG_TYPES, useViewsFilterStore } from "@/app/views-filter/context";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { useCallback, useMemo, useRef } from "react";

export function ViewDropZone({ groupId, position }) {
 const { overActiveId, activeItem } = useViewsFilterStore();

 const isGroupSelfDrag =
  activeItem?.type === DRAG_TYPES.GROUP &&
  activeItem?.group?.groupId === groupId;

 const { setNodeRef } = useDroppable({
  id: `view-drop-${groupId}-${position}`,
  data: { type: "VIEW_DROP_ZONE", groupId, position },
  disabled: isGroupSelfDrag, // Disable if dragging the parent group
 });

 const isActive = useMemo(() => {
  if (isGroupSelfDrag) return false;
  return `view-drop-${groupId}-${position}` === overActiveId;
 }, [groupId, position, overActiveId, isGroupSelfDrag]);

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
  <div ref={setNodeRef} className="mb-2">
   {isActive && flatItems.length > 0 && (
    <div className="space-y-1 h-full">
     {flatItems.map((item, index) => (
      <div
       className="flex items-center justify-between gap-2 bg-white border-2 rounded-lg p-2"
       key={`${item.id}-${index}`}
      >
       <div className="flex items-center gap-2">
        <p className="text-blue-500">{item.id}</p>
        <p className="font-medium text-sm text-green-500">{item.columnId}</p>
       </div>
      </div>
     ))}
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

 // Disable view as drop target if dragging the parent group
 const isGroupSelfDrag =
  activeItem?.type === DRAG_TYPES.GROUP &&
  activeItem?.group?.groupId === groupId;

 const { setNodeRef: setDropRef } = useDroppable({
  id: view.id,
  data: { type: DRAG_TYPES.VIEW, view },
  disabled: isGroupSelfDrag, // Disable if dragging the parent group
 });

 const draggedItemPosition = useMemo(() => {
  if (!activeItem?.view) return -1;
  return viewsInGroup.findIndex((item) => item.id === activeItem.view.id);
 }, [activeItem?.view, viewsInGroup]);

 const dropZoneVisibility = useMemo(() => {
  // Hide drop zones if dragging the parent group
  if (isGroupSelfDrag) {
   return { showTop: false, showBottom: false };
  }

  // If dragging a different group, show all drop zones
  if (activeItem?.type === DRAG_TYPES.GROUP && !isGroupSelfDrag) {
   return { showTop: position === 0, showBottom: true };
  }

  // Original logic for view dragging
  if (!activeItem?.view) {
   return { showTop: position === 0, showBottom: true };
  }

  const isDraggingInThisGroup = draggedItemPosition !== -1;
  if (!isDraggingInThisGroup) {
   return { showTop: position === 0, showBottom: true };
  }

  const showTop =
   position === 0 &&
   !(draggedItemPosition === 0) &&
   !(position === draggedItemPosition + 1);

  const showBottom =
   !(position === draggedItemPosition) &&
   !(position === draggedItemPosition - 1) &&
   !(isLast && draggedItemPosition === viewsInGroup.length - 1);

  return { showTop, showBottom };
 }, [
  activeItem,
  draggedItemPosition,
  position,
  isLast,
  viewsInGroup.length,
  isGroupSelfDrag,
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
   opacity: isDragging ? 0.4 : 1,
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
   {!isDragging && activeItem && dropZoneVisibility.showTop && (
    <ViewDropZone groupId={groupId} position={position} />
   )}

   <div
    className={`flex items-center justify-between gap-2 bg-white border-2 rounded-lg p-2 my-2 relative ${
     isGroupSelfDrag ? "opacity-50 pointer-events-none" : ""
    }`}
    style={style}
    ref={combinedRef}
   >
    <div className="flex items-center gap-2">
     <p className="text-blue-500">{view.id}</p>
     <p className="font-medium text-sm text-green-500">{view.columnId}</p>
    </div>
    <div
     {...dragHandleProps}
     className="cursor-grab active:cursor-grabbing p-2 rounded  text-gray-400 hover:text-gray-600"
    >
     <GripVertical size={16} />
    </div>
   </div>

   {!isDragging && activeItem && dropZoneVisibility.showBottom && (
    <ViewDropZone groupId={groupId} position={position + 1} />
   )}
  </>
 );
}
